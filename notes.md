# notes

[gif search](https://gifcities.org/)

[2d javascript framework](https://pixijs.com)

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
