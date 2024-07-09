'use strict';

// pro-tip: in the event handler functions. manually set the this keyword.

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Date.now().toString().slice(-8);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        // prettier-ignore
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadance) {
        super(coords, distance, duration);
        this.cadance = cadance;
        this._setDescription();
        this.calPace();
    }

    calPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';

    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this._setDescription();
        this.calSpeed();
    }

    calSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

class App {
    #workout = [];
    #map;
    #mapEvent;

    constructor() {
        this._getPosition();

        this._retrieveWorkouts();


        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('The position cannot be captured in your browser.');
                }
            );
        }
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];

        // L is the namespace for the leaflet library.!
        this.#map = L.map('map').setView(coords, 15);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));


        this.#workout.forEach(work => {
            this._renderWorkoutMarker(work);
        })
    }

    _showForm(mapE) {
        //  = mapE;
        this.#mapEvent = mapE;

        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputDistance.value =
            inputDuration.value =
            inputElevation.value =
            inputCadence.value =
                '';

        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>{
            form.style.display = 'grid';
        },1000)
    }

    _toggleElevationField(e) {
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();

        const validate = function (...values) {
            return values.every(val => Number.isFinite(val));
        };

        const valPositive = function (...values) {
            return values.every(val => val > 0);
        };

        // get form data
        const type = inputType.value;
        const duration = +inputDuration.value;
        const distance = +inputDistance.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workOut;
        // create running/cycling object

        // running object
        if (type === 'running') {
            const cadance = +inputCadence.value;

            if (
                !validate(duration, distance, cadance) ||
                !valPositive(distance, duration, cadance)
            ) {
                alert('The Inputs have to be a number!');
                return;
            }

            workOut = new Running([lat, lng], distance, duration, cadance);
        }

        // cycling object
        if (type === 'cycling') {
            const elevationGain = +inputElevation.value;

            if (
                !validate(duration, distance, elevationGain) ||
                !valPositive(duration, distance)
            ) {
                alert('The Inputs have to be a number!');
                return;
            }

            workOut = new Cycling(
                [lat, lng],
                distance,
                duration,
                elevationGain
            );
        }

        // add object to wo array.
        this.#workout.push(workOut);
        console.log(workOut);

        // render workout on map as marker
        this._renderWorkoutMarker(workOut);

        // render workout to list
        this._renderWorkout(workOut);

        // hide form and clear input fields
        this._hideForm();

        this._storeWorkouts();
    }

    _renderWorkoutMarker(workOut) {
        L.marker(workOut.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    autoClose: false,
                    maxWidth: 300,
                    minWidth: 50,
                    closeOnClick: false,
                    className: `${workOut.type}-popup`,
                })
            )
            .setPopupContent(`${workOut.type === 'running' ? "🏃" : "🚴"} ${workOut.description}`)
            .openPopup();
    }

    _renderWorkout(workOut) {
        let woHTML = `<li class="workout workout--running" data-id="${
            workOut.id
        }">
        <h2 class="workout__title">${workOut.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
              workOut.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'
          }</span>
          <span class="workout__value">${workOut.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workOut.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workOut.type === 'running') {
            woHTML += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workOut.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workOut.cadance}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
        }

        if (workOut.type === 'cycling') {
            woHTML += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workOut.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workOut.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
        }

        form.insertAdjacentHTML('afterend', woHTML);
    }

    _moveToPopup(e){

        const workOut = e.target.closest('.workout');
        if(!workOut) return;

        const work = this.#workout.find(work => work.id === workOut.dataset.id);
        this.#map.setView(work.coords,14,{
            animate:true,
            pan:{
                duration:1
            }
        })
    }

    _storeWorkouts(){
        localStorage.setItem('workouts',JSON.stringify(this.#workout));
    }

    _retrieveWorkouts(){
        const data = localStorage.getItem('workouts');

        if(!data) return;

        this.#workout = JSON.parse(data);

        this.#workout.forEach(work => {
            this._renderWorkout(work);
        })

    }

    resetApp(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();
