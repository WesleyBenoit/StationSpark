$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repoRoot = Split-Path -Parent $PSScriptRoot
$chromeCandidates = @(
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
)
$browserPath = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browserPath) {
  throw 'Chrome or Edge is required for demo browser tests.'
}

$port = 9339 + (Get-Random -Minimum 0 -Maximum 300)
$userData = Join-Path $env:TEMP ('stationspark-cdp-' + [guid]::NewGuid().ToString('N'))
$htmlPath = (Resolve-Path (Join-Path $repoRoot 'docs\index.html')).Path.Replace('\', '/')
$url = "file:///$htmlPath"
$process = $null
$socket = $null

function Receive-CdpMessage {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Socket,
    [Threading.CancellationToken]$CancellationToken
  )

  $buffer = New-Object byte[] 1048576
  $builder = [System.Text.StringBuilder]::new()
  do {
    $segment = [ArraySegment[byte]]::new($buffer)
    $result = $Socket.ReceiveAsync($segment, $CancellationToken).Result
    if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
      throw 'Chrome DevTools socket closed.'
    }
    [void]$builder.Append([System.Text.Encoding]::UTF8.GetString($buffer, 0, $result.Count))
  } while (-not $result.EndOfMessage)

  return $builder.ToString() | ConvertFrom-Json
}

try {
  New-Item -ItemType Directory -Force -Path $userData | Out-Null
  $args = @(
    '--headless=new',
    '--disable-gpu',
    '--disable-gpu-compositing',
    '--disable-vulkan',
    '--disable-features=Vulkan,UseSkiaRenderer',
    '--disable-dev-shm-usage',
    '--allow-file-access-from-files',
    "--remote-debugging-port=$port",
    "--user-data-dir=$userData",
    $url
  )
  $process = Start-Process -FilePath $browserPath -ArgumentList $args -WindowStyle Hidden -PassThru

  $deadline = (Get-Date).AddSeconds(20)
  $tabs = $null
  do {
    Start-Sleep -Milliseconds 250
    try {
      $tabs = Invoke-RestMethod -Uri "http://127.0.0.1:$port/json/list" -TimeoutSec 2
    } catch {
      $tabs = $null
    }
  } while (($null -eq $tabs -or @($tabs).Count -eq 0) -and (Get-Date) -lt $deadline)

  if ($null -eq $tabs -or @($tabs).Count -eq 0) {
    throw 'Chrome DevTools target did not appear.'
  }

  $target = @($tabs | Where-Object { $_.url -like 'file://*index.html*' })[0]
  if ($null -eq $target) {
    $target = @($tabs)[0]
  }

  $socket = [System.Net.WebSockets.ClientWebSocket]::new()
  $cancellationToken = [Threading.CancellationToken]::None
  $connected = $false
  $lastSocketError = $null
  for ($attempt = 0; $attempt -lt 10 -and -not $connected; $attempt++) {
    try {
      $socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, $cancellationToken).Wait()
      $connected = $true
    } catch {
      $lastSocketError = $_
      Start-Sleep -Milliseconds 300
      if ($socket) {
        $socket.Dispose()
      }
      $socket = [System.Net.WebSockets.ClientWebSocket]::new()
    }
  }
  if (-not $connected) {
    throw $lastSocketError
  }
  $script:cdpId = 0

  function Invoke-Cdp {
    param(
      [string]$Method,
      [hashtable]$Params = @{}
    )

    $script:cdpId += 1
    $payload = @{ id = $script:cdpId; method = $Method; params = $Params } | ConvertTo-Json -Depth 60 -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
    $socket.SendAsync([ArraySegment[byte]]::new($bytes), [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cancellationToken).Wait()

    while ($true) {
      $message = Receive-CdpMessage -Socket $socket -CancellationToken $cancellationToken
      if ($message.id -eq $script:cdpId) {
        if ($message.error) {
          throw ($message.error | ConvertTo-Json -Compress)
        }
        return $message.result
      }
    }
  }

  Invoke-Cdp -Method 'Runtime.enable' | Out-Null
  Invoke-Cdp -Method 'Page.enable' | Out-Null

  $testJs = @'
(async () => {
  const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = [];
  const assert = (name, pass, details = '') => results.push({ name, pass: !!pass, details: String(details) });
  const text = () => document.body.textContent || '';
  const buttonByText = (label) => Array.from(document.querySelectorAll('button')).find((button) => button.textContent.trim() === label);

  await wait(500);
  localStorage.removeItem('stationspark.profile');
  state.profile = { ...defaultProfile };
  render();
  await wait(120);

  assert('catalog loads 8,423 Tesla locations', window.STATIONSPARK_TESLA_CHARGERS.length === 8423, window.STATIONSPARK_TESLA_CHARGERS.length);
  assert('catalog includes Superchargers', window.STATIONSPARK_TESLA_CHARGER_META.superchargerCount === 3101, window.STATIONSPARK_TESLA_CHARGER_META.superchargerCount);
  assert('catalog includes Destination Chargers', window.STATIONSPARK_TESLA_CHARGER_META.destinationCount === 5322, window.STATIONSPARK_TESLA_CHARGER_META.destinationCount);
  assert('station finder is the default screen', state.tab === 'map' && document.getElementById('screenTitle').textContent === 'Station Finder', state.tab);
  assert('new tagline appears on station finder', text().includes('Turn charging time into connection time.') || text().includes('Find stations and drivers fast'), 'tagline');
  assert('bottom nav uses Stations label', !!buttonByText('Stations'), 'stations nav');
  assert('station finder has no globe canvas', !document.getElementById('chargerCanvas'), 'no canvas');
  assert('station finder exposes near me flow', !!buttonByText('Find stations near me') && text().includes('Near Me demo'), 'near me');
  buttonByText('Find stations near me').click();
  await wait(120);
  assert('near me opens privacy permission flow', state.locationPromptOpen && text().includes('Location privacy') && text().includes('Use manual city'), state.locationPromptOpen);
  buttonByText('Use my location').click();
  await wait(160);
  assert('near me demo filters station finder', state.tab === 'map' && state.nearMeActive && state.locationPermission === 'granted' && state.selectedState === 'AZ' && state.query === 'Scottsdale', `${state.tab}/${state.locationPermission}/${state.selectedState}/${state.query}`);
  clearDirectorySearch();
  await wait(120);
  assert('station finder remains searchable directory', state.tab === 'map' && !document.getElementById('chargerCanvas') && text().includes('Station Finder'), state.tab);
  assert('directory lists charger results', document.querySelectorAll('.directory-result').length > 0 && text().includes('All charger results'), document.querySelectorAll('.directory-result').length);
  assert(
    'station finder is compact by default',
    state.visibleLimit === 12 &&
      document.querySelectorAll('.directory-result').length <= 12 &&
      !!buttonByText('Search') &&
      !!buttonByText('Route') &&
      getComputedStyle(document.querySelector('.route-panel')).display === 'none',
    `${state.visibleLimit}/${document.querySelectorAll('.directory-result').length}`
  );
  assert(
    'app shell uses contained scrolling',
    document.querySelector('.device').getBoundingClientRect().height <= 850 &&
      getComputedStyle(document.getElementById('appContent')).overflowY === 'auto',
    `${document.querySelector('.device').getBoundingClientRect().height}/${getComputedStyle(document.getElementById('appContent')).overflowY}`
  );
  buttonByText('Route').click();
  await wait(80);
  assert('route panel opens from station view switch', state.stationPanel === 'route' && getComputedStyle(document.querySelector('.route-panel')).display !== 'none', state.stationPanel);
  buttonByText('Search').click();
  await wait(80);
  const firstVisibleCharger = getFilteredChargers()[0];
  assert(
    'directory shows selected city and full state',
    text().includes('Selected station location') && text().includes(`${firstVisibleCharger.city}, ${stateLabel(firstVisibleCharger.state)}`),
    `${firstVisibleCharger.city}, ${stateLabel(firstVisibleCharger.state)}`
  );
  assert(
    'directory exposes state and city shortcuts',
    document.querySelectorAll('.coverage-card').length > 0 && document.querySelectorAll('.city-result-button').length > 0 && document.querySelectorAll('.state-heat-tile').length > 40,
    `${document.querySelectorAll('.coverage-card').length}/${document.querySelectorAll('.city-result-button').length}/${document.querySelectorAll('.state-heat-tile').length}`
  );
  assert('station finder has fast filters and saved stations', text().includes('Open Now') && text().includes('Drivers Here') && text().includes('Saved stations') && text().includes('Recent stations'), 'filters/saved');
  assert('station finder labels demo data clearly', text().includes('Demo station activity') && text().includes('Sample driver presence'), 'demo labels');
  assert('station finder shows hybrid EV social model', text().includes('EV command center') && text().includes('Product model') && text().includes('Tesla-style EV command') && text().includes('Bumble BFF-style discovery'), 'hybrid model');
  assert('station finder includes first-run onboarding', text().includes('First-run setup') && text().includes('Confirm 18+'), 'onboarding');
  assert('station finder includes route mode', text().includes('Route mode') && !!buttonByText('Show route chargers'), 'route mode');
  buttonByText('Show route chargers').click();
  await wait(120);
  assert('route mode previews route chargers', state.routeActive && state.chargerType === 'supercharger' && text().includes('Route mode'), `${state.routeActive}/${state.chargerType}`);

  setTab('profile');
  await wait(120);
  assert('profile setup tab opens', state.tab === 'profile' && text().includes('Profile setup'), state.tab);
  assert('profile shows guided setup quality score', text().includes('Guided setup') && text().includes('% complete'), 'quality');
  assert('profile shows verification badges', text().includes('Verification badges') && text().includes('Age confirmed') && text().includes('Tesla owner'), 'verification');
  assert('profile shows verification center and privacy preview', text().includes('Verification center') && text().includes('Trust score') && text().includes('Privacy preview'), 'verification center');
  assert('profile has optional driver and Tesla photo inputs', document.querySelectorAll('input[type="file"][accept="image/*"]').length === 2, document.querySelectorAll('input[type="file"]').length);
  const profileInputs = Array.from(document.querySelectorAll('input'));
  profileInputs.find((input) => input.placeholder === 'First name or display name').value = 'Ben Sparks';
  profileInputs.find((input) => input.placeholder === 'First name or display name').dispatchEvent(new Event('input', { bubbles: true }));
  profileInputs.find((input) => input.placeholder === 'City, state').value = 'Chicago, IL';
  profileInputs.find((input) => input.placeholder === 'City, state').dispatchEvent(new Event('input', { bubbles: true }));
  profileInputs.find((input) => input.placeholder === 'Model Y Long Range').value = 'Cybertruck AWD';
  profileInputs.find((input) => input.placeholder === 'Model Y Long Range').dispatchEvent(new Event('input', { bubbles: true }));
  profileInputs.find((input) => input.placeholder === 'Pearl White').value = 'Stainless';
  profileInputs.find((input) => input.placeholder === 'Pearl White').dispatchEvent(new Event('input', { bubbles: true }));
  const bioInput = document.querySelector('textarea[placeholder="A quick public intro"]');
  bioInput.value = 'I like charging stops with coffee, smart people, and good product ideas.';
  bioInput.dispatchEvent(new Event('input', { bubbles: true }));
  buttonByText('Movies').click();
  await wait(80);
  buttonByText('Save profile').click();
  await wait(140);
  const savedProfile = JSON.parse(localStorage.getItem('stationspark.profile'));
  assert('profile saves public driver info', state.profile.saved && savedProfile.displayName === 'Ben Sparks' && savedProfile.teslaModel === 'Cybertruck AWD', `${state.profile.saved}/${savedProfile.displayName}/${savedProfile.teslaModel}`);
  assert('profile preview updates with driver and Tesla details', text().includes('Ben Sparks') && text().includes('Cybertruck AWD') && text().includes('Movies'), 'preview text');

  setTab('safety');
  await wait(80);
  document.querySelector('button[aria-label="Toggle Mutual Intent Mode"]').click();
  await wait(80);
  document.querySelector('button[aria-label="Toggle adult consent"]').click();
  await wait(80);
  setTab('station');
  await wait(120);
  assert('mutual intent changes station driver pool', text().includes('Riley') && text().includes('Open to adult connection') && text().includes('Mutual Intent invite'), 'mutual station pool');
  setTab('profile');
  await wait(120);
  assert('mutual intent changes discovery stack', text().includes('Mutual Intent driver stack') && text().includes('Discreet connection') && !!buttonByText('Mutual Intent'), 'mutual profile stack');
  setTab('safety');
  await wait(80);
  document.querySelector('button[aria-label="Toggle Mutual Intent Mode"]').click();
  await wait(80);

  setTab('home');
  await wait(120);
  const contentNode = document.getElementById('appContent');
  contentNode.scrollTop = contentNode.scrollHeight;
  await wait(80);
  const navRect = document.querySelector('.tabbar').getBoundingClientRect();
  const appRect = document.querySelector('.app').getBoundingClientRect();
  assert('bottom nav remains visible while content scrolls', navRect.bottom <= appRect.bottom + 1 && navRect.top >= appRect.top, `${navRect.top}/${navRect.bottom}/${appRect.bottom}`);

  setTab('map');
  await wait(160);
  assert('station finder replaces globe canvas', !document.getElementById('chargerCanvas') && text().includes('Find stations and drivers fast'), 'directory');
  const directorySearch = document.querySelector('input[placeholder="Search city, state, station, ZIP"]');
  directorySearch.value = 'Anchorage';
  directorySearch.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(140);
  assert(
    'directory search filters chargers',
    state.query === 'Anchorage' &&
      getFilteredChargers().length > 0 &&
      getFilteredChargers().every((charger) => `${charger.name} ${charger.city} ${charger.state} ${charger.zip}`.toLowerCase().includes('anchorage')),
    getFilteredChargers().length
  );
  assert('directory search shows matching city and full state', text().includes('Anchorage, Alaska (AK)'), 'Anchorage');
  const cityShortcut = document.querySelector('.city-result-button');
  cityShortcut.click();
  await wait(120);
  assert('city shortcut narrows directory by city and state', state.query.length > 0 && state.selectedState !== 'ALL' && getFilteredChargers().length > 0, `${state.query}/${state.selectedState}/${getFilteredChargers().length}`);
  clearDirectorySearch();
  await wait(120);
  const californiaCard = Array.from(document.querySelectorAll('.coverage-card')).find((button) => button.textContent.includes('California (CA)'));
  californiaCard.click();
  await wait(120);
  assert('state tile filters charger directory', state.selectedState === 'CA' && getFilteredChargers().length > 0 && getFilteredChargers().every((charger) => charger.state === 'CA'), `${state.selectedState}/${getFilteredChargers().length}`);
  clearDirectorySearch();
  await wait(120);
  buttonByText('Open Now').click();
  await wait(120);
  assert('open now quick filter applies', state.quickFilter === 'open' && getFilteredChargers().length > 0 && getFilteredChargers().every((charger) => isChargerOpenNow(charger)), `${state.quickFilter}/${getFilteredChargers().length}`);
  buttonByText('Drivers Here').click();
  await wait(120);
  assert('drivers here quick filter applies', state.quickFilter === 'drivers' && getFilteredChargers().length > 0 && getFilteredChargers().every((charger) => getChargerStats(charger).charging > 0), `${state.quickFilter}/${getFilteredChargers().length}`);
  clearDirectorySearch();
  await wait(120);

  setTab('home');
  await wait(120);
  const search = document.querySelector('input[placeholder="City, state, station, ZIP"]');
  search.value = 'Anchorage';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(140);
  assert(
    'search input filters chargers',
    state.query === 'Anchorage' &&
      getFilteredChargers().length > 0 &&
      getFilteredChargers().every((charger) => `${charger.name} ${charger.city} ${charger.state}`.toLowerCase().includes('anchorage')),
    getFilteredChargers().length
  );

  buttonByText('Superchargers').click();
  await wait(120);
  assert('supercharger filter applies', state.chargerType === 'supercharger' && getFilteredChargers().every((charger) => charger.type === 'supercharger'), getFilteredChargers().length);
  search.value = '';
  search.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(120);

  setTab('map');
  await wait(160);
  const openStation = buttonByText('Open Station');
  assert('open station button exists on station finder', !!openStation, 'button lookup');
  openStation.click();
  await wait(120);
  assert('drivers tab opens selected charger', state.tab === 'station' && document.getElementById('screenTitle').textContent === 'Drivers', state.tab);
  assert('station detail shows selected station', text().includes(getSelectedCharger().name), getSelectedCharger().name);
  assert('station detail has marketplace-style driver tabs', text().includes('Here Now') && text().includes('Arriving') && text().includes('Open to Chat') && text().includes('Networking'), 'driver tabs');
  assert('drivers screen has here-now layout and trust badges', text().includes('Drivers Here Now') && text().includes('Age confirmed') && text().includes('Respectful rating'), 'drivers/trust');
  assert('drivers screen has tinder-style discovery deck', text().includes('Driver discovery deck') && text().includes('Pass') && text().includes('Spark') && document.querySelectorAll('.match-card').length > 0, document.querySelectorAll('.match-card').length);
  assert('do not disturb driver is visible but not inviteable', text().includes('Do not disturb') && text().includes('not inviteable'), 'dnd');
  assert('station shows availability and vibe', text().includes('Likely busy') || text().includes('Open stalls likely') || text().includes('Quiet station') || text().includes('High driver activity'), 'availability');
  buttonByText('Join Station').click();
  await wait(120);
  assert('join station opens status modal', state.checkInModalOpen && text().includes('Join Station at') && text().includes('What are you open to?') && text().includes('Privacy preview'), state.checkInModalOpen);
  buttonByText('Do not disturb').click();
  await wait(80);
  Array.from(document.querySelectorAll('.modal-sheet button')).find((button) => button.textContent.trim() === 'Join Station').click();
  await wait(120);
  assert('join station modal saves status and closes', state.checkedIn && !state.checkInModalOpen && state.checkInStatus === 'Do not disturb', `${state.checkedIn}/${state.checkInModalOpen}/${state.checkInStatus}`);

  setTab('chat');
  await wait(80);
  assert('chat locked before invite acceptance', text().includes('Chat is locked until a pending invite is accepted.'), 'locked text');

  setTab('station');
  await wait(80);
  buttonByText('Coffee nearby').click();
  await wait(120);
  assert('standard invite opens composer before sending', state.inviteDraft && state.tab === 'invites' && text().includes('Short invite message'), `${state.inviteDraft?.type}/${state.tab}`);
  assert('sparks explains invites and free limit', text().includes('Sparks are invite requests') && text().includes('Free tier'), 'sparks education');
  const standardInviteMessage = document.getElementById('standardInviteMessage');
  standardInviteMessage.value = 'Want to grab coffee nearby while we charge?';
  standardInviteMessage.dispatchEvent(new Event('input', { bubbles: true }));
  buttonByText('Send invite').click();
  await wait(120);
  assert('invite can be sent from station card', state.inviteSent && !state.inviteDraft && state.tab === 'invites', `${state.inviteSent}/${state.inviteDraft}/${state.tab}`);
  setTab('chat');
  await wait(80);
  assert('chat remains locked while invite pending', text().includes('Chat is locked until a pending invite is accepted.'), 'pending lock');
  setTab('invites');
  await wait(80);
  buttonByText('Accept Invite').click();
  await wait(120);
  assert('accepted invite unlocks chat control', state.inviteAccepted && !buttonByText('Open chat').disabled, state.inviteAccepted);
  buttonByText('Open chat').click();
  await wait(120);
  assert('chat opens after accepted invite', state.tab === 'chat' && text().includes('Maya'), state.tab);
  buttonByText('Still charging?').click();
  await wait(80);
  assert('quick reply adds chat message', state.messages.some((message) => message.body === 'Still charging?'), state.messages.length);
  buttonByText('Block').click();
  await wait(120);
  assert('block disables accepted chat', state.blocked && !state.inviteAccepted, `${state.blocked}/${state.inviteAccepted}`);

  setTab('station');
  await wait(80);
  assert('mutual intent invite hidden by default', !buttonByText('Mutual Intent invite'), 'hidden');
  setTab('safety');
  await wait(80);
  if (!state.adultMode) {
    document.querySelector('button[aria-label="Toggle Mutual Intent Mode"]').click();
    await wait(80);
  }
  if (!state.adultConsent) {
    document.querySelector('button[aria-label="Toggle adult consent"]').click();
    await wait(80);
  }
  await wait(80);
  setTab('station');
  await wait(100);
  assert('mutual intent invite visible only after opt-in and consent', !!buttonByText('Mutual Intent invite'), 'visible after toggles');
  buttonByText('Mutual Intent invite').click();
  await wait(140);
  assert('mutual intent invite opens intent composer', state.privateInviteDraft && text().includes('Short invite message'), state.privateInviteDraft?.intent);
  const privateInviteMessage = document.getElementById('privateInviteMessage');
  privateInviteMessage.value = 'I am interested in a private adult connection if the chemistry is mutual. Chat first?';
  privateInviteMessage.dispatchEvent(new Event('input', { bubbles: true }));
  buttonByText('Send Mutual Intent invite').click();
  await wait(140);
  assert('mutual intent invite includes sender intent message', state.invitePrivate && text().includes('What the sender wants') && text().includes('adult connection'), `${state.invitePrivate}/${state.inviteMessage}`);
  buttonByText('Accept Invite').click();
  await wait(120);
  assert('mutual intent invite can be accepted before chat', state.inviteAccepted && !buttonByText('Open chat').disabled, state.inviteAccepted);
  buttonByText('Open chat').click();
  await wait(120);
  assert('private accepted invite opens clear chat', state.tab === 'chat' && text().includes('Riley') && text().includes('adult connection'), state.tab);

  setTab('safety');
  await wait(80);
  assert('safety center shows moderation state rows', text().includes('Invite state') && text().includes('Chat state') && text().includes('Reports'), 'moderation rows');
  assert('safety shows private consent layer checkpoints', text().includes('Private consent layer') && text().includes('Visibility consent') && text().includes('Mutual recipient'), 'consent layer');
  assert('safety has hide shortcuts and admin dashboard', text().includes('Hide me for 30 minutes') && text().includes('Admin moderation dashboard') && text().includes('Invite abuse'), 'admin/hide');
  const statusInput = document.getElementById('statusInput');
  statusInput.value = 'explicit meetup';
  buttonByText('Save status').click();
  await wait(120);
  assert('public status moderation rejects explicit terms', document.getElementById('toast').textContent.includes('rejected'), document.getElementById('toast').textContent);

  const failed = results.filter((result) => !result.pass);
  return {
    passed: failed.length === 0,
    total: results.length,
    failed,
    selected: getSelectedCharger().name,
    filteredCount: getFilteredChargers().length,
    mapPointCount: mapRuntime.points.length,
    results
  };
})()
'@

  $evaluation = Invoke-Cdp -Method 'Runtime.evaluate' -Params @{
    expression = $testJs
    awaitPromise = $true
    returnByValue = $true
    userGesture = $true
  }

  if ($env:STATIONSPARK_DEBUG_EVAL -eq '1') {
    $evaluation | ConvertTo-Json -Depth 20
    exit 1
  }

  $result = $evaluation.result.value
  if ($null -eq $result) {
    $evaluation | ConvertTo-Json -Depth 12
    exit 1
  }
  $result | ConvertTo-Json -Depth 12
  if (-not $result.passed) {
    exit 1
  }
} finally {
  if ($socket -and $socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
    $socket.Dispose()
  }
  if ($process -and -not $process.HasExited) {
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  }
  if (Test-Path $userData) {
    Remove-Item -LiteralPath $userData -Recurse -Force -ErrorAction SilentlyContinue
  }
}
