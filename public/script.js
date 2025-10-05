document.getElementById('createForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const question = document.getElementById('question').value;
  const option1 = document.getElementById('option1').value;
  const option2 = document.getElementById('option2').value;

  const options = {};
  options[option1] = 0;
  options[option2] = 0;

  fetch('/polls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options })
  })
  .then(res => res.json())
  .then(data => {
    alert('Poll created!');
    loadPolls();
  });
});

function loadPolls() {
  fetch('/polls')
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById('pollsList');
      list.innerHTML = data.map(p => `
        <div>
          <strong>${p.question}</strong><br>
          ${Object.keys(p.options).map(opt => `
            <label>
              <input type="radio" name="vote-${p.id}" value="${opt}"> ${opt} (${p.options[opt]})
            </label><br>
          `).join('')}
          <button onclick="vote('${p.id}')">Vote</button>
        </div><hr>
      `).join('');
    });
}

function vote(pollId) {
  const selected = document.querySelector(`input[name="vote-${pollId}"]:checked`);
  if (!selected) return alert('Please choose an option!');
  fetch(`/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ option: selected.value })
  })
  .then(res => res.json())
  .then(data => {
    alert('Vote recorded!');
    loadPolls();
  });
}

loadPolls();
let currentPoll = null;
let myChart = null;

function renderPoll(poll) {
  currentPoll = poll;
  const pollContainer = document.getElementById('pollContainer');
  pollContainer.innerHTML = '';

  const questionEl = document.createElement('h2');
  questionEl.textContent = poll.question;
  pollContainer.appendChild(questionEl);

  const optionsForm = document.createElement('form');

  for (const option in poll.options) {
    const label = document.createElement('label');
    label.textContent = option;
    
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'option';
    radio.value = option;
    label.prepend(radio);
    
    const lineBreak = document.createElement('br');
    optionsForm.appendChild(label);
    optionsForm.appendChild(lineBreak);
  }

  const voteBtn = document.createElement('button');
  voteBtn.textContent = 'Vote';
  voteBtn.type = 'submit';

  optionsForm.appendChild(voteBtn);
  pollContainer.appendChild(optionsForm);

  const chartCanvas = document.createElement('canvas');
  chartCanvas.id = 'resultsChart';
  pollContainer.appendChild(chartCanvas);

  optionsForm.onsubmit = async (e) => {
    e.preventDefault();
    const selected = optionsForm.option.value;
    if (!selected) {
      alert('Please select an option');
      return;
    }

    const res = await fetch(`/polls/${poll.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: selected })
    });

    const updated = await res.json();
    if (updated.poll) {
      currentPoll = updated.poll;
      updateChart(currentPoll.options);
    } else {
      alert(updated.error || 'Vote failed');
    }
  };

  // Draw chart initially
  updateChart(poll.options);
}

function updateChart(options) {
  const ctx = document.getElementById('resultsChart').getContext('2d');
  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(options),
      datasets: [{
        label: 'Votes',
        data: Object.values(options),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

