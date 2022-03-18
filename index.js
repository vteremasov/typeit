const canvas        = document.getElementById('canvas');
const renderButton  = document.getElementById('render');
const progress      = document.querySelector('.progress');
const textArea      = document.getElementById('text');
const ctx = canvas.getContext('2d');

const TEXT_TO_RENDER = 'Ich bin verheiratet...';
textArea.value = TEXT_TO_RENDER;

function simpleThrottle(f, timeout) {
	let then = Date.now();
	let res = null;
	return function(...args) {
		if (then + timeout <= Date.now() || res === null) {
			res = f(...args);
			then = Date.now();
		}

		return res;
	}
}

function draw(ctx, textData, cursorVisible = true) {
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#404040"
	ctx.fillRect(0, 0, canvas.width, 20)
	ctx.fillStyle = "#f32b99"
	ctx.beginPath();
	ctx.arc(canvas.width - 10, 10, 5, 0, 2 * Math.PI);
	ctx.fill();

	ctx.fillStyle = "#2bf33c"
	ctx.beginPath();
	ctx.arc(canvas.width - 30, 10, 5, 0, 2 * Math.PI);
	ctx.fill();

	ctx.fillStyle = "#f3d22b"
	ctx.beginPath();
	ctx.arc(canvas.width - 50, 10, 5, 0, 2 * Math.PI);
	ctx.fill();

	ctx.font = '14px monospace';
	
	ctx.fillStyle = '#ffffff';
	ctx.fillText(textData.text, textData.x, textData.y);
	if (cursorVisible) {
		ctx.fillRect((textData.x + ctx.measureText(textData.text).width), textData.y - 11, 1.5, 14);
	}
}

let cursorVisible = false;
let text = '';
let i = 0;
function *writer(text) {
	let t = text.split('');
	let direct = true;
	let countWS = 0;
	const shouldSkip = (ch) => {
		if (countWS < 8 && ch === ' ') {
			countWS++;
			return true
		}
		countWS = 0;
		return false;
	}
	while (true) {
		if (direct) {
			if(!shouldSkip(t[i-1])) i++;
		} else {
			i--;
		}
		if(i === 0) {
			if (render) {
				startRecording();
				render = false
			} else if (recordGif) {
				stopRecording();
			}
			direct = true;
		}
		if (i === text.length) {
			direct = false;
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
			yield t.slice(0, i).join('');
		}
		yield t.slice(0, i).join('');
	}
}
let write = writer(textArea.value);
const getText = simpleThrottle(() => write.next().value, 30);
const getVisible = simpleThrottle((s) => !s, 80);

let recordGif = false;
let render = false;
let gif;

function startRecording() {
	i = 0;
	text = '';
	write = writer(textArea.value)
	gif = new GIF({
		workers: 5,
		quality: 10,
		width: canvas.width,
		height: canvas.height,
	});
	gif.setOption('debug', true);
	recordGif = true;
}
renderButton.addEventListener('click', () => {
	render = true;
	renderButton.disble = true;
	renderButton.textContent = 'Recording'
});

function stopRecording() {
	recordGif = false;

	gif.on('finished', (blob) => {
		const button = document.createElement('button');
		button.textContent = 'Remove';
		document.body.appendChild(button)
		button.style.marginTop = '10px';
		const img = document.createElement('img');
		img.src = URL.createObjectURL(blob);
		img.style.display = "block";
		img.style.width = canvas.width;
		img.style.height = canvas.height;
		img.style.marginTop = '10px';
		document.body.appendChild(img)
		const a = document.createElement('a');
		a.href = img.src;
		a.download = 'typeit.gif'
		a.textContent = 'Download'
		document.body.appendChild(a);
		progress.style.width = '0';
		button.addEventListener('click', () => {
			document.body.removeChild(button);
			document.body.removeChild(img);
			document.body.removeChild(a);
		});

		renderButton.textContent = 'Render';
	})

	gif.on('progress', function (p) {
		progress.style.width = (p * 100) + '%';
	});

	gif.render();
}

function renderLoop() {
	if (recordGif) {
		const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
		gif.addFrame(img, {delay: 1.0 / 60 * 2000, dispose: -1,});
	}
	cursorVisible = getVisible(cursorVisible);
	text = getText();
	draw(ctx, {text, x: 20, y: canvas.height / 2}, cursorVisible)
	requestAnimationFrame(renderLoop);
}

renderLoop();


