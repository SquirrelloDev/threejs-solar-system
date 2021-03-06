import * as THREE from 'three';
import {FirstPersonControls} from 'three/examples/jsm/controls/FirstPersonControls.js';
import AudioManager from './audioManager';

export const buildSolarSystem = () =>
{
    const out = document.querySelector('.WebGL_out')
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 12000 );
    
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    out.appendChild( renderer.domElement );
    // const controls = new OrbitControls(camera, renderer.domElement);
    const FPPContrls = new FirstPersonControls(camera,renderer.domElement);
    const clock = new THREE.Clock();
    FPPContrls.movementSpeed = 20;
    FPPContrls.lookSpeed = .2;

    //load all textures
    const loader = new THREE.TextureLoader();
    const sunTexture = loader.load('./textures/2k_sun.jpg');
    const mercuryTexture = loader.load('./textures/2k_mercury.jpg');
    const venusTexture = loader.load('./textures/2k_venus_atmosphere.jpg');
    const earthTexture = loader.load('./textures/2k_earth_daymap.jpg');
    const earthMoonTexture = loader.load('./textures/2k_moon.jpg')
    const marsTexture = loader.load('./textures/2k_mars.jpg');
    const jupiterTexture = loader.load('./textures/2k_jupiter.jpg');
    const saturnTexture = loader.load('./textures/2k_saturn.jpg');
    const saturnRingsTexture = loader.load('./textures/rings2.png');
    const uranusTexture = loader.load('./textures/2k_uranus.jpg');
    const neptuneTexture = loader.load('./textures/2k_neptune.jpg');
    

    //create sun
    const sunGeo  = new THREE.SphereGeometry(80);
    const sunMat = new THREE.MeshBasicMaterial( { map: sunTexture, emmisive: 0xe8aa54} );
    const sun = new THREE.Mesh( sunGeo, sunMat );
    sun.position.x = -30;
    scene.add( sun );

    //create skybox
    const cubeLoader = new THREE.CubeTextureLoader();
    const bgTexture = cubeLoader.load([
      './textures/2k_stars_milky_way_Right.bmp',
      './textures/2k_stars_milky_way_Left.bmp',
      './textures/2k_stars_milky_way_Top.bmp',
      './textures/2k_stars_milky_way_Bottom.bmp',
      './textures/2k_stars_milky_way_Front.bmp',
      './textures/2k_stars_milky_way_Back.bmp',
    ]);
    scene.background = bgTexture;

    camera.position.z = 5;
    camera.position.x = 80;
    
    //create light
    const Plight = new THREE.PointLight(0xffffff,1, 12000);
    Plight.castShadow = true;
    scene.add(Plight);

    
    //function to create celestial
    const createCelestial = (size, texture) => {
      const celestialGEO = new THREE.SphereGeometry(size);
      const celestialMAT = new THREE.MeshStandardMaterial({map: texture});
      return new THREE.Mesh(celestialGEO, celestialMAT);
    }

    //create solar system planets and them to the scene
    const mercury = createCelestial(2.28, mercuryTexture);
    const venus = createCelestial(5.64, venusTexture);
    const earth = createCelestial(6, earthTexture);
    const earthMoon = createCelestial(1, earthMoonTexture);
    const mars = createCelestial(3.18, marsTexture);
    const jupiter = createCelestial(66, jupiterTexture);
    const saturn = createCelestial(54, saturnTexture);
    const uranus = createCelestial(24, uranusTexture);
    const neptune = createCelestial(18, neptuneTexture);
    scene.add(mercury);
    scene.add(venus);
    scene.add(mars);
    scene.add(jupiter);
    scene.add(uranus);
    scene.add(neptune);

    earth.receiveShadow = true;
    earth.castShadow = true;
    earthMoon.receiveShadow = true;
    earthMoon.castShadow = true;
    //create rings for saturn
    const saturnRingGEO = new THREE.RingBufferGeometry(3,100,64)
    let pos = saturnRingGEO.attributes.position;
    let v3 = new THREE.Vector3();
    for(let i = 0; i< pos.count; i++)
    {
      v3.fromBufferAttribute(pos, i);
      saturnRingGEO.attributes.uv.setXY(i, v3.length() < 4 ? 0 : 1, 1)
    }
    const saturnRingMAT = new THREE.MeshBasicMaterial({map: saturnRingsTexture, transparent:true, side: THREE.DoubleSide});
    const saturnRingMESH = new THREE.Mesh(saturnRingGEO, saturnRingMAT);
    saturnRingMESH.rotation.x = Math.PI /2;
    saturnRingMESH.rotation.y = Math.PI / 12;
    scene.add(saturnRingMESH);
    //add the rings to Saturn
    const saturnGroup = new THREE.Group();
    saturnGroup.add(saturn);
    saturnGroup.add(saturnRingMESH);
    scene.add(saturnGroup);
    
    //create group with Earth and moon
    const earthGroup = new THREE.Group();
    earthGroup.add(earth);
    earthGroup.add(earthMoon);
    scene.add(earthGroup);
    //initial values for periods
    const periods = {
      circulationPeriods:
      {
        pMer: 0,
        pVen: 0,
        pEarth: 0,
        pMars: 0,
        pJupiter: 0,
        pSaturn: 0,
        pUranus: 0,
        pNeptune: 0,
      },
      rotationPeriods:
      {
        pMer: 0.00035,
        pVen: 0.00005,
        pEarth: 0.001,
        pMars: 0.00095,
        pJupiter: 0.002,
        pSaturn: 0.0015,
        pUranus: 0.0012,
        pNeptune: 0.0013,
      }
      
    };
    //function to circular movement
    const circularMovement = (celestial, rotationPeriod = 0.001, distance, t) => {
      if(celestial === venus)
      {
        celestial.rotation.y -= rotationPeriod;
      }
      else
      {
        celestial.rotation.y += rotationPeriod;
      }
      celestial.position.x = distance * Math.cos(t)  - 30;
      celestial.position.z = distance * Math.sin(t) + 0;
    }
    //check full movement around the circle and restore to 0
    const checkFullPeriod = periodsObj => {
      for (const key in periodsObj) {
        if(periodsObj[key] >= 6.28)
        {
          periodsObj[key] = 0;
        }
      }
    }
    let t=0;
    //loop fn
    const animate = function () {
      requestAnimationFrame( animate );
      if(t >= 6.28)
      {
        t = 0;
      }
      checkFullPeriod(periods.circulationPeriods);
      saturnRingMESH.rotation.z += 0.1
      t += 0.01;
      periods.circulationPeriods.pMer+=0.002;
      periods.circulationPeriods.pVen += 0.000584;
      periods.circulationPeriods.pEarth +=0.000365; //1 year
      periods.circulationPeriods.pMars +=0.000182;
      periods.circulationPeriods.pJupiter += 0.000047;
      periods.circulationPeriods.pSaturn +=0.000022;
      periods.circulationPeriods.pUranus +=0.00001;
      periods.circulationPeriods.pNeptune +=0.000001;
        sun.rotation.y += 0.001;
        FPPContrls.update(clock.getDelta());
        circularMovement(mercury, periods.rotationPeriods.pMer, 150, periods.circulationPeriods.pMer);
        circularMovement(venus,  periods.rotationPeriods.pVen, 280, periods.circulationPeriods.pVen);
        circularMovement(earthGroup,  periods.rotationPeriods.pEarth, 390, periods.circulationPeriods.pEarth);
        circularMovement(mars,  periods.rotationPeriods.pMars, 585, periods.circulationPeriods.pMars);
        circularMovement(jupiter,  periods.rotationPeriods.pJupiter, 1950, periods.circulationPeriods.pJupiter);
        circularMovement(saturnGroup,  periods.rotationPeriods.pSaturn, 3705, periods.circulationPeriods.pSaturn);
        circularMovement(uranus,  periods.rotationPeriods.pUranus, 7410, periods.circulationPeriods.pUranus);
        circularMovement(neptune,  periods.rotationPeriods.pNeptune, 11700, periods.circulationPeriods.pNeptune);
        earthMoon.position.x = 10 * Math.cos(t)  + 0;
        earthMoon.position.z = 10 * Math.sin(t) + 0;
        renderer.render( scene, camera );
    };
    animate();
    const getPosition = (celPos) => {
      return celPos.position;
    }
    //change aspect ratio after resizing the viewport
    window.addEventListener(
        'resize',
        function() {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize( window.innerWidth, window.innerHeight );
          renderer.render( scene, camera );
          FPPContrls.handleResize();
        },
        );
    //for controls (use shift to "sprint")    
    window.addEventListener('keydown', e =>
    {
      switch (e.key)
      {
        case 'Shift':
          FPPContrls.movementSpeed = 100;
          break;
      }
    });
    window.addEventListener('keyup', e =>
    {
      switch (e.key)
      {
        case 'Shift':
          FPPContrls.movementSpeed = 20;
          break;
      }
    });
    //apply sound effects (for future)
        // const btn = document.querySelector('.fastBTN');
        // // const audioManager = new AudioManager('./sounds/ambient.mp3', './sounds/impact.mp3');
        // // // out.addEventListener('mouseover', audioManager.playAmbient.bind(audioManager));
        // // btn.addEventListener('click', audioManager.playInteraction.bind(audioManager));
        // btn.addEventListener('click', () =>{

        //   // camera.position.set(mercury.position.x, mercury.position.y, mercury.position.z);
        // });


}
