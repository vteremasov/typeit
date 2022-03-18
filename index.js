const canvas        = document.getElementById('canvas');
const renderButton  = document.getElementById('render');
const progress      = document.querySelector('.progress');
const ctx = canvas.getContext('2d');

const TEXT_TO_RENDER = 'Ich bin verheiratet...';

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
	while (true) {
		if (direct) {
			i++;
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
			direct = true
		}
		if (i === text.length) {
			direct = false;
		}
		yield t.slice(0, i).join('');
	}
}
const write = writer(TEXT_TO_RENDER);
const getText = simpleThrottle(() => write.next().value, 30);
const getVisible = simpleThrottle((s) => !s, 15);

let recordGif = false;
let render = false;
let gif;

function startRecording() {
	gif = new GIF({
		workers: 5,
		quality: 10,
		width: canvas.width,
		height: canvas.height,
	});
	gif.setOption('debug', true);
	recordGif = true;
  // const chunks = []; // here we will store our recorded media chunks (Blobs)
  // const stream = canvas.captureStream(); // grab our canvas MediaStream
  // rec = new MediaRecorder(stream); // init the recorder
  // // every time the recorder has new data, we will store it in our array
  // rec.ondataavailable = e => chunks.push(e.data);
	// console.log(chunks)
  // // only when the recorder stops, we construct a complete Blob from all the chunks
  // rec.onstop = e => exportVid(new ImageData(chunks, canvas.width, canvas.height));
  //
  // rec.start();
}
renderButton.addEventListener('click', () => render = true);

function stopRecording() {
	recordGif = false;

	gif.on('finished', (blob) => {
		const img = document.createElement('img');
		img.src = URL.createObjectURL(blob);
		img.style.display = "block";
		img.style.width = canvas.width;
		img.style.height = canvas.height;
		img.style.marginTop = canvas.height / 2 + 'px';
		document.body.appendChild(img)
		const a = document.createElement('a');
		a.href = img.src;
		a.download = 'typeit.gif'
		a.textContent = 'Download'
		document.body.appendChild(a);
		progress.style.width = '0';
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


