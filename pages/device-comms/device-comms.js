// webserial api https://developer.chrome.com/docs/capabilities/serial

let count = 0;
const counterElement = document.getElementById("counter");

if ("serial" in navigator) {
	console.log("serial supported");
}

const asciiDecoder = new TextDecoder("ascii");

document.getElementById('serial-button').addEventListener('click', async () => {
	// esp32 dev board vendorid:productid = 1a86:7523 QinHeng Electronics CH340 serial converter
	const filters = [
		{ usbVendorId: 0x1a86, usbPoductId: 0x7523 }
	];
	const port = await navigator.serial.requestPort({ filters });
	await port.open({ baudRate: 9600 });

	const reader = port.readable.getReader();
	while (true) {
		const { value, done } = await reader.read();
		if (done) {
			reader.releaseLock();
			break;
		}
		const count = asciiDecoder.decode(value);
		counterElement.textContent = count;
	}
});
