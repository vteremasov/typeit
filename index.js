const canvas        = document.getElementById('canvas');
const renderButton  = document.getElementById('render');
const progress      = document.querySelector('.progress');
const textArea      = document.getElementById('text');
const widthInput    = document.getElementById('width');
const heightInput   = document.getElementById('height');

const HEADER_HEIGHT = 21.5;

let CTX = null;
let TEXT_TO_RENDER = `def main():
    print('hello world')

if __name__ == '__main__':
    main()`;
let WIDTH = 500;
let HEIGHT = 250;
widthInput.value = WIDTH;
heightInput.value = HEIGHT;
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

function getContext(width, height) {
	const scale         = window.devicePixelRatio;
	canvas.width        = width * scale;
	canvas.height       = height * scale;
	canvas.style.width  = `${width}px`;
	canvas.style.height = `${height}px`;
	const ctx           = canvas.getContext('2d');
	ctx.scale(scale, scale);
	return ctx;
}

function drawHeader(ctx) {
	ctx.fillStyle = "#404040"
	ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT)
	ctx.fillStyle = "#f32b99"
	ctx.beginPath();
	ctx.arc(WIDTH - 10.5, 10.5, 5.5, 0, 2 * Math.PI);
	ctx.fill();

	ctx.fillStyle = "#2bf33c"
	ctx.beginPath();
	ctx.arc(WIDTH - 30.5, 10.5, 5.5, 0, 2 * Math.PI);
	ctx.fill();

	ctx.fillStyle = "#f3d22b"
	ctx.beginPath();
	ctx.arc(WIDTH - 50.5, 10.5, 5.5, 0, 2 * Math.PI);
	ctx.fill();

	ctx.fillStyle = "#ffffff";
	ctx.font = "bold 13px arial";
	const xPos = WIDTH / 2 - 30;
	ctx.fillText("NVIM", xPos, 16);
	ctx.fillText('[name]', xPos + 38, 14);
}

function drawLineNumbers(ctx) {
	ctx.fillStyle = '#2c2c2c'
	ctx.fillRect(0, HEADER_HEIGHT, 20, HEIGHT);
	ctx.fillStyle = '#989696'
	ctx.strokeStyle = '#989696'
	ctx.beginPath();
	ctx.moveTo(20, HEADER_HEIGHT);
	ctx.lineTo(20, HEIGHT);
	ctx.stroke();
	ctx.font = '10px Arial';
	const count = Math.floor(HEIGHT / 14);
	for (let i = 1; i <= count; i++) {
		ctx.fillText(i.toString(10), 15 - (i.toString().length * 5), (i - 1) * 14 + 40);
	}
}

function draw(ctx, textData, cursorVisible = true) {
	ctx.fillStyle = "#282828";
	ctx.fillRect(0, 0, WIDTH, HEIGHT);

	drawHeader(ctx);
	drawLineNumbers(ctx);

	ctx.font = '14px Arial';
	
	ctx.fillStyle = '#ffffff';
	let nl = -1;
	let lines = textData.text.split('\n');
	let lc = lines.length;
	lines.forEach((line, i) => {
		nl++;
		ctx.fillText(line, textData.x, textData.y + (i * 14));
	});
	if (cursorVisible) {
		ctx.fillRect((textData.x + ctx.measureText(lines[lc - 1]).width), textData.y - 11 + (14 * nl), 1.5, 14);
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
		if (countWS < 3 && ch === ' ') {
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
const getText = simpleThrottle(() => write.next().value, 20);
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
		width: WIDTH * 2,
		height: HEIGHT * 2,
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
		console.log(blob);
		const button = document.createElement('button');
		button.textContent = 'Remove';
		document.body.appendChild(button)
		button.style.marginTop = '10px';
		const img = document.createElement('img');
		img.src = URL.createObjectURL(blob);
		img.style.display = "block";
		img.style.width = `${WIDTH}px`;
		img.style.height = `${HEIGHT}px`;
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
	if (!CTX || WIDTH !== widthInput.value || HEIGHT !== heightInput.value) {
		WIDTH = widthInput.value;
		HEIGHT = heightInput.value;
		CTX = getContext(WIDTH, HEIGHT);
	}
	if (textArea.value !== TEXT_TO_RENDER) {
		TEXT_TO_RENDER = textArea.value;
		i = 0;
		text = '';
		write = writer(textArea.value);
	}
	if (recordGif) {
		const img = CTX.getImageData(0, 0, WIDTH * 2, HEIGHT * 2);
		gif.addFrame(img, {delay: 1.0 / 60 * 2000, dispose: -1,});
	}
	cursorVisible = getVisible(cursorVisible);
	text = getText();
	draw(CTX, {text, x: 30, y: 40}, cursorVisible)
	requestAnimationFrame(renderLoop);
}
renderLoop();


