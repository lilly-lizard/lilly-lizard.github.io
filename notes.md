# todo

verify vcc voltage
verify pin connects
re-wire trig to be stepped up through level converter

protocol:
- is bt just a serial line? assume yes.
- protocol can be changed at a later date. just get it working first.
- output stream of 32 bit floats for best accuract and variation.
- for now just output ascii, matches 8bits followed by 2 bits

two scenarios
- too fast: length < 6
- too slow: length >= 6
- worst case value: 4 bytes, 4x 255, 4 more from next float but not the 255 finisher yet, grab 9 bytes total
1. append value to global array
2. check if global array has 4 bytes before a 4x255
3. if yes, grab the float, cut everything before (and including) the 4x255 (so newest bytes can be used for next read)

[ultrasound datasheet](https://core-electronics.com.au/attachments/localcontent/HCSR04_80625a9081e.pdf)

# notes

[gif search](https://gifcities.org/)

[2d javascript framework](https://pixijs.com)

[circuit simulation](https://www.falstad.com/circuit/)

# plan

electrons moving around circuit
- just DC for now
- electron speed * density = current aka electrons per second
- electron color = voltage aka energy
- power supply
	- option to enable potential difference arrows
	- show energy being added to circuit by v and i arrows aligning
	- checkbox to reverse i arrows to show standard current direction
- wires
- resistor
- somehow visually show low/high resistance struggle for electrons to move through
- set amount of electrons per circuit
	- no breaks in single electron continuity
	- electrons packed back to back in series circuit
	- electrons split down different paths at junction
- want kids to think of electrons as marbles pushing on each other so space between electrons should be pretty much uniform throughout the circuit (just like irl I think)
	- alternate idea...
	- low r: wide, spread out and fast?
	- high r: thin, bunched together and slow?
	- na. seeing different speeds in series is confusing because it implies different currents.

- set amount of electron entities
	- total number can be adjusted via "global density" param
	- screen space pos
	- relative pos within current component
	- energy/color
- component
	- type
	- resistance
	- density (spread out or bunched together)

1. start out with rectangle and make electrons move around perimeter
	- draw a rectangle
	- draw wires
