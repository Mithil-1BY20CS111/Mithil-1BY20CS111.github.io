

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { XRHandModelFactory } from 'three/examples/jsm/webxr/XRHandModelFactory.js'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import Bolt from '../vendor/Moar/scripts/Bolt.js'
import { Handy } from '../src/Handy.js'
import { SurfaceText } from '../vendor/Moar/scripts/SurfaceText.js'





let 
camera,
scene,
renderer,
controls,
stats,
world

function setupThree(){


	

	const container = document.getElementById( 'three' )



	const
	fieldOfView = 75,
	aspectRatio = window.innerWidth / window.innerHeight,
	near = 0.01,
	far  = 1000,
	userHeight = 1.65

	camera = new THREE.PerspectiveCamera( 
		
		fieldOfView, 
		aspectRatio,
		near,
		far 
	)
	camera.position.set( 0, userHeight, 6 )
window.camera = camera
	
	scene = new THREE.Scene()
	scene.add( camera )




	world = new THREE.Group()
	scene.add( world )



	renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio( window.devicePixelRatio )
	renderer.setSize( window.innerWidth, window.innerHeight )
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.xr.enabled = true
	container.appendChild( VRButton.createButton( renderer ))
	container.appendChild( renderer.domElement )


	
	controls = new OrbitControls( camera, renderer.domElement )
	controls.target.set( 0, userHeight, 0 )
	controls.update()



	window.addEventListener( 'resize', function(){
	
		camera.aspect = window.innerWidth / window.innerHeight
		camera.updateProjectionMatrix()
		renderer.setSize( window.innerWidth, window.innerHeight )
		controls.update()

	}, false )



	stats = new Stats()
	document.body.appendChild( stats.domElement )



	
	renderer.setAnimationLoop( loop )
}







window.THREE = THREE
window.Handy = Handy




function setupHands(){


	




	const 
	handModelFactory = new XRHandModelFactory(),
	cycleHandModel = function( event ){

		const hand = event.hand
		console.log(

			'Cycling the hand model for the',
			 hand.handedness.toUpperCase(),
			'hand.'
		)
		hand.models.forEach( function( model ){

			model.visible = false
		})
		hand.modelIndex = ( hand.modelIndex + 1 ) % hand.models.length
		hand.models[ hand.modelIndex ].visible = true
	},
	colors = {

		default: new THREE.Color( 0xFFFFFF ),//  White glove.
		left:    new THREE.Color( 0x00FF00 ),//  Green glove for left.
		right:   new THREE.Color( 0xFF0000 ) //  Red glove for right.
	}


	const [ hand0, hand1 ] = [ {}, {} ]
	.map( function( hand, i ){


		
		hand = renderer.xr.getHand( i )
		scene.add( hand )


		
		hand.models = [

			handModelFactory.createHandModel( hand, 'boxes' ),
			handModelFactory.createHandModel( hand, 'spheres' ),
			handModelFactory.createHandModel( hand, 'mesh' )
		]
		hand.modelIndex = 0
		hand.isDefaultColor = true




		//  This is what makes detecting hand poses easy!

		Handy.makeHandy( hand )

		hand.displayFrameAnchor = new THREE.Object3D()
		hand.add( hand.displayFrameAnchor )
		hand.displayFrame = new SurfaceText({

			text: 'No data',
			canvas: {

				width:  512,
				height: 128
			},
			virtual: {

				width:  0.20,
				height: 0.05
			},
			style: {

				fontFamily: 'bold monospace',
				fontSize:   '30px',
				textAlign:  'center',
				fillStyle:  '#00DDFF'
			}
		})
		hand.displayFrameAnchor.add( hand.displayFrame )
		hand.displayFrame.visible = true//false


		

		hand.addEventListener( 'connected', function( event ){

			

			hand.handedness = event.data.handedness


			

			hand.models.forEach( function( model ){

				hand.add( model )
				model.visible = false
			})	
			hand.models[ hand.modelIndex ].visible = true
		})


		

		hand.addEventListener( 'fist pose began', cycleHandModel )


		

		hand.addEventListener( 'pose changed', function( event ){

			console.log( event.message )
			if( event.resultIs.pose.names.includes( 'peace' ) &&
				!event.resultWas.pose.names.includes( 'peace' )){

				console.log( 'Changing glove color for', hand.handedness )
				hand.checkHandedness()
				hand.traverse( function( obj ){

					if( obj.material ){


						
						obj.material.color = hand.isDefaultColor ? 
							colors[ hand.handedness ] : 
							colors.default
					}
				})
				hand.isDefaultColor = !hand.isDefaultColor
			}
		})


		//  We’re going to make our display frames vsible

		hand.displayFrame.visible = true


		return hand
	})
}






function setupContent() {


	const background = new THREE.CubeTextureLoader()
	.setPath( 'vendor/Three/media/milkyway/' )
	.load([ 

		'dark-s_px.jpg', 
		'dark-s_nx.jpg', 
		'dark-s_py.jpg', 
		'dark-s_ny.jpg', 
		'dark-s_pz.jpg', 
		'dark-s_nz.jpg' 
	])


	//  Now we can set the Milky Way as our scene’s background.

	scene.background = background


	//  Let’s create a circular platform to “stand” on in space.

	const platform = new THREE.Mesh( 


		new THREE.CylinderGeometry( 4.5, 5, 1, 12 ),


		
		new THREE.MeshStandardMaterial({
		
			color: 0xFFEECC,
			roughness: 0.2,
			metalness: 1.0,
			emissive: 0xFFFFFF,
			emissiveIntensity: 0.05
		})
	)


	//  Objects are positioned according to their center

	platform.position.set( 0, -0.5, 0 )
	
	platform.receiveShadow = true

	world.add( platform )
	

	//  Let there be light.
	//  Directional lights create parallel light rays.
	//  https://threejs.org/docs/#api/en/lights/DirectionalLight

	const light = new THREE.DirectionalLight( 0xFFFFFF )
	light.position.set( -2, 8, 0 )
	scene.add( light )


	//  Lensflare !

	const 
	loader    = new THREE.TextureLoader(),
	texture0  = loader.load( 'vendor/Three/media/lensflare/lensflare0.png' ),
	texture3  = loader.load( 'vendor/Three/media/lensflare/lensflare3.png' ),
	lensflare = new Lensflare()

	lensflare.position.copy( light.position )
	lensflare.addElement( new LensflareElement( texture0, 700, 0.0 ))
	lensflare.addElement( new LensflareElement( texture3,  60, 0.6 ))
	lensflare.addElement( new LensflareElement( texture3,  70, 0.7 ))
	lensflare.addElement( new LensflareElement( texture3, 120, 0.9 ))
	lensflare.addElement( new LensflareElement( texture3,  70, 1.0 ))
	scene.add( lensflare )
}






    //////////////
   //          //
  //   Loop   //
 //          //
//////////////


let 
timePrevious,
leftHandWalkPoseWas,
rightHandWalkPoseWas

window.walk = walk//  Just for testing!
function walk(){

	// console.log( '\n\nWALKING!\n\n' )
	
	const
	position = new THREE.Vector3(),
	rotation = new THREE.Quaternion(),
	scale    = new THREE.Vector3(),
	eulor    = new THREE.Euler()
	
	camera.matrixWorld.decompose( position, rotation, scale )


	//  Get just the headset’s rotation around the Y axis.

	eulor.setFromQuaternion( camera.getWorldQuaternion(), 'YXZ' )
	console.log( 'eulor.y', eulor.y )



	const
	vector = new THREE.Vector3( 0, 0, -1 ),//  Start by looking straight ahead.
	axis   = new THREE.Vector3( 0, 1, 0 ), //  Rotate around the Y-axis only.
	angle  = eulor.y//  Take the Y-axis rotation from the headset.

	

	vector.applyAxisAngle( axis, angle )
	vector.multiplyScalar( 0.5 )//  Let’s only move a little distance at a time.
	world.position.sub( vector )
}
function loop( timeNow, frame ){

	Handy.update( function( hand ){

		if( hand.isPose( 'fire point', 4000 )){



			const bolt = new Bolt(

				// scene,//  The bolt must know what scene to attach itself to.
				// hand, //  Used for ‘handedness’ as well as attaching some state to.
				hand.joints[ 'wrist' ]//  Reference point.
			)
			
			
			if( bolt ){

				
						
				console.log( 'Shot fired!' )
			}
		}


		

		if( hand.displayFrame.visible === true && 
			hand.joints[ 'wrist' ] &&
			hand.joints[ 'wrist' ].position ){

			const wrist = hand.joints[ 'wrist' ]
			hand.displayFrameAnchor.position.copy( wrist.position )
			hand.displayFrameAnchor.quaternion.copy( wrist.quaternion )


			//  TO DO:
			//  displayFrame should actually ORBIT the wrist at a fixed radius
			//  and always choose the orbit degree that faces the camera.
			
			let handedness = hand.handedness
			if( handedness === 'left' || handedness === 'right' ){

				handedness = handedness.toUpperCase()
			}
			else {

				handedness = 'UNKNOWN'
			}
			if( handedness === 'LEFT' ){

				hand.displayFrame.position.set( 0.06, -0.05, 0.02 )
			}
			if( handedness === 'RIGHT' ){

				hand.displayFrame.position.set( -0.06, -0.05, 0.02 )
			}
			hand.displayFrame.rotation.x = Math.PI / -2
			hand.displayFrame.rotation.y = Math.PI

			let displayString = handedness
			if( hand.searchResults.length &&
				hand.searchResults[ 0 ].pose ){

				displayString += '\n'+ hand.searchResults[ 0 ].pose.names
				.reduce( function( names, name, i ){

					if( i ) names += ', '
					return names += name

				}, '' )
				displayString +='\n@ '+ hand.searchResults[ 0 ].distance.toLocaleString() +'mm'
			}
			hand.displayFrame.print( displayString )
		}


	})





	const 
	leftHand = Handy.hands.getLeft(),
	rightHand = Handy.hands.getRight()

	if( leftHand !== undefined && rightHand !== undefined ){


		//  If this all seems verbose in terms of variable names
		//  or the nested logic it’s for human legibility. 

		window.bothHandsExist = true

		const		
		leftHandIsFlat = !!leftHand.isPose( 'flat', 8000 ),
		leftHandIsWalkingIndex  = !!leftHand.isPose( 'walk index down', 5000 ),
		leftHandIsWalkingMiddle = !!leftHand.isPose( 'walk middle down', 5000 ),
		leftHandIsWalking = leftHandIsWalkingIndex || leftHandIsWalkingMiddle

		const
		rightHandIsFlat = !!rightHand.isPose( 'flat', 8000 ),
		rightHandIsWalkingIndex  = !!rightHand.isPose( 'walk index down', 5000 ),
		rightHandIsWalkingMiddle = !!rightHand.isPose( 'walk middle down', 5000 ),
		rightHandIsWalking = rightHandIsWalkingIndex || rightHandIsWalkingMiddle

		if(
			( leftHandIsFlat && rightHandIsWalking ) || 
			( leftHandIsWalking && rightHandIsFlat )){

			window.aHandIsWalking = true
			if( leftHandIsWalking ){
			
				window.leftHandIsWalking = true
				if(
					( leftHandIsWalkingIndex && leftHandWalkPoseWas === 'middle' ) ||
					( leftHandIsWalkingMiddle && leftHandWalkPoseWas === 'index' )){
					
					walk()
				}
				leftHandWalkPoseWas = leftHandIsWalkingIndex ? 'index' : 'middle'
			}
			else if( rightHandIsWalking ){

				window.rightHandIsWalking = true
				if(
					( rightHandIsWalkingIndex && rightHandWalkPoseWas === 'middle' ) ||
					( rightHandIsWalkingMiddle && rightHandWalkPoseWas === 'index' )){
					
					walk()
				}
				rightHandWalkPoseWas = rightHandIsWalkingIndex ? 'index' : 'middle'
			}
		}
	}


	
	if( timePrevious === undefined ) timePrevious = timeNow
	const timeDelta = ( timeNow - timePrevious ) / 1000
	timePrevious = timeNow
	Bolt.update( timeDelta )


	renderer.render( scene, camera )
	stats.update()
}







window.addEventListener( 'DOMContentLoaded', function(){

	setupThree()
	Bolt.setup( scene )
	setupHands()
	setupContent()
})







