// Ajax
if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
  xhr = new XMLHttpRequest();
} else { // code for IE6, IE5
  xhr = new ActiveXObject("Microsoft.XMLHTTP");
}

xhr.onreadystatechange = function () {
  if (xhr.readyState === 4 && xhr.status === 200) {
    // Parse the response
    const parser = new DOMParser();
    const doc = parser.parseFromString(xhr.responseText, 'text/html');
    const result = doc.body.innerHTML;

    // Get and clone stickers before destroying DOM
    const original = document.getElementById('sticker-zone');
    let clone = original ? original.cloneNode(true) : null;

    // Grab compliment
    const compliment = document.getElementById('compliment-text').value;
    
    // Replace the page content
    document.body.innerHTML = result;

    // Re-insert stickers if clone exists
    if (clone) {
      const stickers = clone.querySelectorAll('.sticker-container');
      stickers.forEach(sticker => {
        sticker.style.opacity = '1';
      });
      document.body.appendChild(clone);
    }

    // Generate the new stickers
    generateSticker(compliment, new Date().toLocaleDateString(), 5);
  }
};

// Grab cookes with this function
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  const match = cookies.find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

// Generate stickers of past compliments
const raw = getCookie('compliments');
const list = JSON.parse(decodeURIComponent(raw));

if (list) {
  if (list.length > 0) {
    list.forEach( (v) => {
      generateSticker(v.compliment, v.timestamp);  
    });
  }
}

function generateSticker(text, timestamp, customDuration) {
  const stickerZone = document.getElementById('sticker-zone');

  const container = document.createElement('div');
  container.className = 'sticker-container';
  const img = document.createElement('img');

  // Randomly pick one of the two stickers
  const choice = Math.random() < 0.5 ? 1 : 2;
  img.src = `images/sticker${choice}.png`;
  img.alt = 'Sticker';
  img.className = 'sticker-img';

  const textDiv = document.createElement('div');
  textDiv.className = 'sticker-text';
  textDiv.innerHTML = `${text}<br/><br/><strong>${timestamp}</strong>`;

  container.appendChild(img);
  container.appendChild(textDiv);

  // random rotation between -10 and 10 degrees
  const rotation = (Math.random() * 20 - 10).toFixed(2);

  // random position that avoids 35–65%
  function randomEdgePercent() {
    const r = Math.random();
    return r < 0.5
      ? Math.floor(Math.random() * 20) + 10     // 10%–30%
      : Math.floor(Math.random() * 30) + 57;    // 57%–87%
  }
  const top = randomEdgePercent();
  const left = randomEdgePercent();

  // random animation duration between 1.5s and 3s
  const duration = customDuration ? customDuration : (Math.random() * 1.5 + 1.5).toFixed(2) + 's';

  Object.assign(container.style, {
    transform: `rotate(${rotation}deg)`,
    top: `${top}vh`,
    left: `${left}vw`,
    animationDuration: duration
  });

  stickerZone.appendChild(container);
}

// Adjust volume of ambient sound
const ambient = document.getElementById("ambient");
ambient.volume = 0.5;

// Track cursor
const ring = document.querySelector(".cursor-ring"); // Grab the ring from the page
window.addEventListener('mousemove', e => {
    const [x, y] = [e.clientX, e.clientY];
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';

    // Create sparkle
    const sparkle = document.createElement('div');
    sparkle.classList.add('sparkle');
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';

    document.body.appendChild(sparkle);

    // Clean up sparkle after animation
    setTimeout(() => {
    sparkle.remove();
    }, 600);
});

let textarea = document.getElementById('compliment-text');
// Event to check key presses when typing in compliment text area
textarea.addEventListener('keydown', (event) => {
    const click = document.getElementById('key-pressed-audio');
    click.volume = 0.1;      
    const keyAudioNumber = Math.floor(Math.random() * 4) + 1;
    const keyAudioSource = document.querySelector('#key-pressed-audio source');
    keyAudioSource.src = `sfx/key_press_${keyAudioNumber}.mp3`;
    click.load();
    
    // Play key without restarting if it's already playing
    if (click.paused) {
        click.play().catch(() => {
        console.warn('click play was blocked by browser');
        });
    } else {
        click.currentTime = 0;
    }
});

// Handles when a user submits a compliment
const form = document.getElementById('compliment-form');
const paper = document.getElementById('submit-paper-audio');

const ding = document.getElementById('submit-ding-audio');
paper.volume = 0.1;
ding.volume = 0.05;
form.addEventListener('submit', function (e) {
  e.preventDefault(); // prevent reload
  xhr.open("POST", '/submit', true);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  // Encode data (key=value format)
  const textareaValue = textarea.value;
  const encodedData = `compliment=${encodeURIComponent(textareaValue)}`;
  xhr.send(encodedData);

  // Choose a random paper noise out of the 3
  const paperAudioNumber = Math.floor(Math.random() * 3) + 1;
  const paperAudioSource = document.querySelector('#submit-paper-audio source');
  paperAudioSource.src = `sfx/paper_flip_${paperAudioNumber}.mp3`;
  paper.load();

  setTimeout(() => {
    // Check for ambient sound
    if (ambient.paused) ambient.play();
    
    // Play paper without restarting if it's already playing
    if (paper.paused) {
      ding.play();
      paper.play().catch(() => {
        console.warn('paper play was blocked by browser');
      });
    } else {
      paper.currentTime = 0;
    }

    // Clear form
    form.reset();
  }, 200);
});