$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repoRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $repoRoot 'docs\data'
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

$service = 'https://services.arcgis.com/xOi1kZaI0eWDREZv/arcgis/rest/services/Alternative_Fueling_Stations/FeatureServer/0/query'
$where = [uri]::EscapeDataString("fuel_type_code='ELEC' AND country='US' AND (ev_network='Tesla' OR ev_network='Tesla Destination')")
$fields = [uri]::EscapeDataString('id,station_name,street_address,city,state,zip,latitude,longitude,ev_network,ev_dc_fast_num,ev_level2_evse_num,ev_level1_evse_num,ev_connector_types,date_last_confirmed,open_date,access_code,access_days_time,ev_pricing,country')

$countUri = "${service}?where=$where&returnCountOnly=true&f=json"
$count = (Invoke-RestMethod -Uri $countUri -TimeoutSec 30).count
$records = New-Object System.Collections.Generic.List[object]
$pageSize = 2000

for ($offset = 0; $offset -lt $count; $offset += $pageSize) {
  $uri = "${service}?where=$where&outFields=$fields&returnGeometry=false&f=json&resultOffset=$offset&resultRecordCount=$pageSize&orderByFields=state,city,station_name"
  $page = Invoke-RestMethod -Uri $uri -TimeoutSec 60

  foreach ($feature in $page.features) {
    $station = $feature.attributes
    $connectors = @()
    if ($station.ev_connector_types) {
      try {
        $connectors = @($station.ev_connector_types | ConvertFrom-Json)
      } catch {
        $connectors = @($station.ev_connector_types)
      }
    }

    $dcFast = if ($null -ne $station.ev_dc_fast_num) { [int]$station.ev_dc_fast_num } else { 0 }
    $level2 = if ($null -ne $station.ev_level2_evse_num) { [int]$station.ev_level2_evse_num } else { 0 }
    $level1 = if ($null -ne $station.ev_level1_evse_num) { [int]$station.ev_level1_evse_num } else { 0 }
    $type = if ($station.ev_network -eq 'Tesla Destination') { 'destination' } else { 'supercharger' }
    $lastConfirmed = $null
    $openDate = $null

    if ($station.date_last_confirmed) {
      $lastConfirmed = ([DateTimeOffset]::FromUnixTimeMilliseconds([int64]$station.date_last_confirmed)).UtcDateTime.ToString('yyyy-MM-dd')
    }
    if ($station.open_date) {
      $openDate = ([DateTimeOffset]::FromUnixTimeMilliseconds([int64]$station.open_date)).UtcDateTime.ToString('yyyy-MM-dd')
    }

    $records.Add([pscustomobject][ordered]@{
      id = "afdc-$($station.id)"
      sourceId = $station.id
      type = $type
      network = if ($type -eq 'destination') { 'Tesla Destination' } else { 'Tesla Supercharger' }
      name = $station.station_name
      address = $station.street_address
      city = $station.city
      state = $station.state
      zip = $station.zip
      lat = [double]$station.latitude
      lng = [double]$station.longitude
      ports = ($dcFast + $level2 + $level1)
      dcFast = $dcFast
      level2 = $level2
      connectors = $connectors
      access = $station.access_code
      hours = $station.access_days_time
      pricing = $station.ev_pricing
      lastConfirmed = $lastConfirmed
      openDate = $openDate
    })
  }
}

$ordered = @($records | Sort-Object state, city, name)
$totalPorts = ($ordered | Measure-Object -Property ports -Sum).Sum
$superchargers = @($ordered | Where-Object { $_.type -eq 'supercharger' }).Count
$destinations = @($ordered | Where-Object { $_.type -eq 'destination' }).Count
$states = @(
  $ordered |
    Group-Object state |
    Sort-Object Name |
    ForEach-Object { [pscustomobject][ordered]@{ state = $_.Name; count = $_.Count } }
)

$meta = [pscustomobject][ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  source = 'AFDC Alternative Fueling Stations ArcGIS layer'
  sourceUrl = 'https://data-usdot.opendata.arcgis.com/datasets/usdot::alternative-fueling-stations/about'
  apiDocsUrl = 'https://developer.nlr.gov/docs/transportation/alt-fuel-stations-v1/'
  superchargerCount = $superchargers
  destinationCount = $destinations
  totalCount = $ordered.Count
  totalPorts = [int]$totalPorts
  stateCount = $states.Count
  states = $states
}

$json = $ordered | ConvertTo-Json -Depth 8 -Compress
$metaJson = $meta | ConvertTo-Json -Depth 8 -Compress
$content = "window.STATIONSPARK_TESLA_CHARGERS=$json;`nwindow.STATIONSPARK_TESLA_CHARGER_META=$metaJson;`n"
$target = Join-Path $dataDir 'tesla-us-chargers.js'
[System.IO.File]::WriteAllText($target, $content, [System.Text.UTF8Encoding]::new($false))

Write-Output "Generated $target with $($ordered.Count) Tesla charging locations ($superchargers Superchargers, $destinations Destination Chargers, $([int]$totalPorts) ports)."
