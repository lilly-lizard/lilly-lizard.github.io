import { Application, Assets, Container, Sprite } from '/lib/pixi_v8.10.2.min.mjs'

(async () => {
	const app = new Application();
	await app.init({ background: '#0e1339', resizeTo: window });

	// chuck the new canvas in the html document
	document.body.appendChild(app.canvas);

	// collection of bunnies
	const bunnies = new Container();
	app.stage.addChild(bunnies);

	const texture = await Assets.load('/assets/bunny.png');
	for (let i = 0; i < 25; i++) {
		const bunny = new Sprite(texture);
		bunny.x = (i % 5) * 40;
		bunny.y = Math.floor(i / 5) * 40;
		bunnies.addChild(bunny);
	}

	// place in center of screen
	bunnies.x = app.screen.width / 2;
	bunnies.y = app.screen.height / 2;

	// translate to center
	bunnies.pivot.x = bunnies.width / 2;
	bunnies.pivot.y = bunnies.height / 2;

	app.ticker.add((time) => {
		bunnies.rotation -= 0.01 * time.deltaTime;
	});
})();