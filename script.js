var ui = {mapX: 1000, mapY: 500, mapScale: 0.5, isDragging: false};
const MAPW = 5760, MAPH = 3240, MAX_OFFBOUNDS = 0.5;

var markers_promise = fetch('./markers.json')
	.then((response) => response.json())
	.then((json) => {
		markers_info = json;
});
document.addEventListener("DOMContentLoaded", () => {
	map = document.getElementById("map");
	markers_promise.then(() => {
		console.log(markers_info);
		map.style.backgroundImage = `url('assets/map0.png')`;
		setMapScale(ui.mapScale);
		setMapPos(ui.mapX, ui.mapY);
	});

map.addEventListener("touchstart", (e) => {
	ui.isDragging = true;
	startTouchGesture(e);
	e.preventDefault();
});
map.addEventListener("touchmove", (e) => {
	debug.innerHTML = `Move<br>`;
	debug.innerHTML += `${ui.touchCount} touches<br>`;
	if (ui.touchCount != e.targetTouches.length) {
		startTouchGesture(e);
		return;
	}
	let avgX = Array.prototype.reduce.call(e.targetTouches, (acc, touch) => acc + touch.clientX, 0)
		/ e.targetTouches.length;
	let avgY = Array.prototype.reduce.call(e.targetTouches, (acc, touch) => acc + touch.clientY, 0)
		/ e.targetTouches.length;
	drag(avgX, avgY);
	map.children[0].style.left = avgX+"px";
	map.children[0].style.top = avgY+"px";
	debug.innerHTML += `X: ${ui.dragStartX}<br>`;
	debug.innerHTML += `Y: ${ui.dragStartY}<br>`;
	//map.children[1].style.left = (ui.dragStartX-ui.mapX)*ui.mapScale+"px";
	//map.children[1].style.top = (ui.dragStartY-ui.mapY)*ui.mapScale+"px";

	// Calculate new average touch distance if we're currently pinching
	if (ui.pinchStart !== null && e.targetTouches.length > 1) {
		let avgDistance = Array.prototype.reduce.call(e.targetTouches, (acc, touch) => {
			return acc + Math.hypot(touch.clientX - (ui.dragStartX-ui.mapX)*ui.mapScale, touch.clientY - (ui.dragStartY-ui.mapY)*ui.mapScale);
		}, 0) / e.targetTouches.length;

		debug.innerHTML += `Pinch ${ui.pinchStart}<br>`;
		debug.innerHTML += `Avg ${avgDistance}<br>`;
		// Calculate pinch scale factor based on change in average distance
		scale(avgDistance * ui.pinchStart / ui.mapScale, avgX, avgY);
	}
	e.preventDefault();
});
	map.addEventListener("touchend", (e) => {
		if (e.targetTouches.length == 0)
			ui.isDragging = false;
	});

	map.addEventListener("mousedown", (e) => {
		ui.isDragging = true;
		ui.dragStartX = ui.mapX + e.clientX / ui.mapScale;
		ui.dragStartY = ui.mapY + e.clientY / ui.mapScale;
	});
	map.addEventListener("mousemove", (e) => {
		if (e.buttons == 0)
			ui.isDragging = false;
		else
			drag(e.clientX, e.clientY);
	});
	map.addEventListener('mousewheel', (e) => {
		if (!e.ctrlKey)
			scale(1-Math.sign(e.deltaY)*0.3, e.clientX, e.clientY);
	});
});

function startTouchGesture(e) {
	ui.touchCount = e.targetTouches.length;
	ui.dragStartX = Array.prototype.reduce.call(e.targetTouches, (acc, touch) => acc + touch.clientX, 0)
		/ e.targetTouches.length / ui.mapScale + ui.mapX;
	ui.dragStartY = Array.prototype.reduce.call(e.targetTouches, (acc, touch) => acc + touch.clientY, 0)
		/ e.targetTouches.length / ui.mapScale + ui.mapY;
	debug.innerHTML += `Start<br>`;
	debug.innerHTML += `${ui.touchCount} touches<br>`;
	debug.innerHTML += `X: ${ui.dragStartX}<br>`;
	debug.innerHTML += `Y: ${ui.dragStartY}<br>`;
	if (e.targetTouches.length > 1) {
		let avgDistance = Array.prototype.reduce.call(e.targetTouches, (acc, touch) => {
			return acc + Math.hypot(touch.clientX - (ui.dragStartX-ui.mapX)*ui.mapScale, touch.clientY - (ui.dragStartY-ui.mapY)*ui.mapScale);
		}, 0) / e.targetTouches.length;
		ui.pinchStart = ui.mapScale / avgDistance;
		debug.innerHTML += `Pinch ${ui.pinchStart}<br>`;
		debug.innerHTML += `Avg ${avgDistance}<br>`;
	}
	else
		ui.pinchStart = null;
}

function drag(newX, newY) {
	setMapPos(ui.dragStartX - newX / ui.mapScale,
		ui.dragStartY - newY / ui.mapScale);
}

function scale(factor, pivotX, pivotY) {
	let targetX = pivotX / ui.mapScale;
	let targetY = pivotY / ui.mapScale;

	setMapScale(ui.mapScale * factor);
	setMapPos(ui.mapX + targetX - pivotX / ui.mapScale,
		ui.mapY + targetY - pivotY / ui.mapScale);
}

function setMapPos(x, y) {
	let maxOffboundsX = map.clientWidth * MAX_OFFBOUNDS / ui.mapScale;
	let maxOffboundsY = map.clientHeight * MAX_OFFBOUNDS / ui.mapScale;
	ui.mapX = Math.max(-maxOffboundsX, Math.min(MAPW + maxOffboundsX - map.clientWidth / ui.mapScale, x));
	ui.mapY = Math.max(-maxOffboundsY, Math.min(MAPH + maxOffboundsY - map.clientHeight / ui.mapScale, y));
	map.style.backgroundPosition = `${-ui.mapX * ui.mapScale}px ${-ui.mapY * ui.mapScale}px`;
}

function setMapScale(factor) {
	let minScale = Math.min(map.clientWidth / MAPW, map.clientHeight / MAPH);
	let maxScale = 1;
	ui.mapScale = Math.min(maxScale, Math.max(minScale, factor));
	map.style.backgroundSize = MAPW / map.clientWidth * ui.mapScale * 100 + "%";
	console.log("Scale:", ui.mapScale);
}