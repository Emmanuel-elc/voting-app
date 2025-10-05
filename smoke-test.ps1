$base='http://localhost:10000'

Write-Host 'Register test user'
try {
  $reg = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType 'application/json' -Body (@{id='smoketest2'; name='Smoke Test 2'; password='s3cret'} | ConvertTo-Json)
  $reg | ConvertTo-Json -Depth 5
} catch { Write-Host 'Register failed'; $_ }

Write-Host 'Login'
try {
  $login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body (@{id='smoketest2'; password='s3cret'} | ConvertTo-Json)
  $login | ConvertTo-Json -Depth 5
} catch { Write-Host 'Login failed'; $_ }

Write-Host 'Create poll'
try {
  $payload = @{ question = 'Smoke test poll'; options = @{ 'X' = 0; 'Y' = 0 } }
  $poll = Invoke-RestMethod -Method Post -Uri "$base/polls" -ContentType 'application/json' -Body ($payload | ConvertTo-Json -Depth 5)
  $poll | ConvertTo-Json -Depth 5
} catch { Write-Host 'Create poll failed'; $_ }

if ($poll -and $poll.data) {
  $id = $poll.data.id
  Write-Host "Vote on poll $id"
  try {
    $vote = Invoke-RestMethod -Method Post -Uri "$base/polls/$id/vote" -ContentType 'application/json' -Body (@{ option='X'; userId='smoketest2' } | ConvertTo-Json)
    $vote | ConvertTo-Json -Depth 5
  } catch { Write-Host 'Vote failed'; $_ }
} else { Write-Host 'Poll not created; skipping vote' }

Write-Host 'Done'