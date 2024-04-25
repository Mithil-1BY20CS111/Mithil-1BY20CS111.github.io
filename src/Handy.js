

import { poses as posesLeft  } from './Handy-poses-left.js'
import { poses as posesRight } from './Handy-poses-right.js'
import {
	Vector3,
	MathUtils,
	Object3D,
	Mesh,
	BoxBufferGeometry,
	MeshBasicMaterial,
} from 'three';

const Handy = {


	

	REVISION: 5,



	jointNames: [

		'wrist',                             //   0
		
		'thumb-metacarpal',                  //   1
		'thumb-phalanx-proximal',            //   2
		'thumb-phalanx-distal',              //   3
		'thumb-tip',                         //   4

		'index-finger-metacarpal',           //   5
		'index-finger-phalanx-proximal',     //   6
		'index-finger-phalanx-intermediate', //   7
		'index-finger-phalanx-distal',       //   8
		'index-finger-tip',                  //   9

		'middle-finger-metacarpal',          //  10
		'middle-finger-phalanx-proximal',    //  11
		'middle-finger-phalanx-intermediate',//  12
		'middle-finger-phalanx-distal',      //  13
		'middle-finger-tip',                 //  14

		'ring-finger-metacarpal',            //  15
		'ring-finger-phalanx-proximal',      //  16
		'ring-finger-phalanx-intermediate',  //  17
		'ring-finger-phalanx-distal',        //  18
		'ring-finger-tip',                   //  19

		'pinky-finger-metacarpal',           //  20
		'pinky-finger-phalanx-proximal',     //  21
		'pinky-finger-phalanx-intermediate', //  22
		'pinky-finger-phalanx-distal',       //  23
		'pinky-finger-tip'                   //  24
	],



	digitNames: [

		'thumb',
		'index',
		'middle',
		'ring',
		'pinky'
	],
	digitTipNames: [

		'thumb-tip', //   4
		'index-finger-tip', //   9
		'middle-finger-tip',//  14
		'ring-finger-tip',  //  19
		'pinky-finger-tip' //  24
	],
	isDigitTipIndex: function( i ){

		return (

			i >  0 &&
			i < 25 &&
			!(( i + 1 ) % 5 )
		)
	},
	fingerNames: [

		'index',
		'middle',
		'ring',
		'pinky'
	],
	isFingerTipIndex: function( i ){

		return (

			i >  4 &&
			i < 25 &&
			!(( i + 1 ) % 5 )
		)
	},


	VECTOR3_ZERO: new Vector3(),



	poses: {

		left:  posesLeft,
		right: posesRight
	},


	

	searchLoopDurationLimit: 6,


	
	protos: {},


	

	hands: [],


	
	update: function( callbackForAllHands ){

		this.hands.forEach( function( hand ){

			hand.update( callbackForAllHands )
		})
	},


	

	makeHandy: function( obj ){

		obj.name = 'hand'


		
		const scene = obj.parent


		

		obj.camera = scene.children.find( function( child ){
			return child.type === 'PerspectiveCamera'
		})


		

		Object.entries( Handy.protos )
		.forEach( function( entry ){

			if( obj[ entry[ 0 ]] === undefined ) obj[ entry[ 0 ]] = entry[ 1 ]
		})


		

		Handy.hands.push( obj )
	}
}



Handy.jointNames.forEach( function( name, i ){

	Handy[ name ] = i
})



Object.assign( Handy.hands, {

	getLeft: function(){

		return this.find( function( hand ){ 

			return hand.handedness === 'left'
		})
	},
	getRight: function(){

		return this.find( function( hand ){ 

			return hand.handedness === 'right'
		})
	}
})






    ////////////////
   //            //
  //   Protos   //
 //            //
////////////////


Object.assign( Handy.protos, {


	

	checkHandedness: function(){

		const hand = this
		this.traverse( function( obj ){

			if( obj.xrInputSource !== undefined &&
				obj.xrInputSource.handedness !== undefined ){

				hand.handedness = obj.xrInputSource.handedness
				hand.name = 'hand '+ hand.handedness			
			}
		})
		return this.handedness
	},


	
	distanceBetweenJoints: function( jointNameA, jointNameB ){

		if( this.joints.length === 0 ) return NaN

		const
		hand = this,
		[ jointA, jointB ] = [ jointNameA, jointNameB ]
		.map( function( name ){

			return hand.joints[ 

				// Handy[ name.toUpperCase().replace( /\s+/g, '_' )]
				name.toLowerCase().replace( /\s+/g, '-' )
			]
		})

		if( jointA.position && 
			jointB.position &&
			( !jointA.position.equals( jointB.position ))){

			return jointA.position.distanceTo( jointB.position ) * 100
		}
		else return NaN
	},


	

	digitAngle: function( fingerName ){

		fingerName = fingerName.toLowerCase()

		const
		fingerTip = fingerName === 'thumb' ? 
			this.joints[ 'thumb-tip' ] :
			this.joints[ fingerName +'-finger-tip' ],
		fingerProximal = fingerName === 'thumb' ?
			this.joints[ 'thumb-phalanx-proximal' ] :
			this.joints[ fingerName +'-finger-phalanx-proximal' ]

		if( fingerTip && 
			fingerProximal && 
			fingerTip.quaternion &&
			fingerProximal.quaternion ){

			return MathUtils.radToDeg( 

				fingerProximal.quaternion.angleTo( fingerTip.quaternion )
			)
		}
		return NaN
	},


	

	digitIsExtended: function( digitName ){

		return this.digitAngle( digitName ) < 45
	},
	digitIsContracted: function( digitName ){

		return this.digitAngle( digitName ) > 110
	},


	
	reportDigits: function(){

		const hand = this
		Handy.digitNames
		.forEach( function( digitName ){

			const 
			proximalName = digitName === 'thumb' ?
				'thumb-phalanx-proximal' :
				digitName +'-finger-phalanx-proximal',
			tipName = digitName === 'thumb' ?
				'thumb-tip' : 
				digitName + '-finger-tip',
			distance = hand.distanceBetweenJoints(

				proximalName,
				tipName
			),
			digitAngle = hand.digitAngle( digitName )

			console.log( 

				hand.handedness, 
				digitName +'.', 
				'angle:',
				Math.round( digitAngle )+'˚',
				'distance:',
				( Math.round( distance * 10 ) / 10 ) +'cm',
				hand.digitIsExtended( digitName ) ?
					'is extended' :
					'is contracted'
			)
		})
	},






	    ////////////////
	   //            //
	  //   Record   //
	 //            //
	////////////////


	
	readLivePoseData: function(){

		const 
		hand  = this,
		wrist = hand.joints[ 'wrist' ],
		jointPositions    = [],
		digitTipPositions = [],


		
		preparePosition = function( joint ){

			const 
			jointMatrix = joint.matrix
			.clone()
			.premultiply( 

				// new THREE.Matrix4().copy( wrist.matrixWorld.invert() )
				wrist.matrixWorld.clone().invert()
			)

			
			return [ 

				Math.round( jointMatrix.elements[ 12 ] * 1000 ),
				Math.round( jointMatrix.elements[ 13 ] * 1000 ),
				Math.round( jointMatrix.elements[ 14 ] * 1000 )
			]
		},


		

		headPosition = 
			wrist !== undefined && !wrist.position.equals( Handy.VECTOR3_ZERO )
			? preparePosition( hand.camera )
			: null,
		headRotation = 
			headPosition === null
			? null
			: hand.camera.quaternion.toArray()


		

		
		Object.values( hand.joints )
		.forEach( function( joint, i ){

			

			if( joint !== undefined &&
				joint.position !== undefined &&
				joint.position.equals( Handy.VECTOR3_ZERO ) === false ){

				const preparedPosition = preparePosition( joint )
				jointPositions[ i ] = preparedPosition

				if( Handy.isDigitTipIndex( i )){

					digitTipPositions.push( preparedPosition )
				}
			}
		})
		
		


	
		return { 

			headPosition,
			headRotation,
			jointPositions,
			digitTipPositions
		}
	},


	

	recordLivePose: function( name, showIt ){

		const 
		hand = this,
		handedness = hand.checkHandedness(),
		pose = Object.assign(

			{
				names: [ name ],
				handedness,				
				handyRevision: Handy.REVISION,
				time: Date.now()
			},
			hand.readLivePoseData()
		)
		
		console.log( '\n\nPOSE DEFINITION\n\n'+ JSON.stringify( pose ) +',\n\n\n' )
		Handy.poses[ handedness ].push( pose )
		if( showIt ) hand.showPose( pose, hand.joints[ 0 ].matrixWorld )
		return pose
	},


	

	showPose: function( pose, matrix ){

		const
		hand  = this,
		handRoot = new Object3D(),
		size = 0.02

		pose.jointPositions
		.forEach( function( position ){

			const box = new Mesh(
				new BoxBufferGeometry( size, size, size ),
				new MeshBasicMaterial()
			)
			box.position.fromArray( position ).multiplyScalar( 0.001 )
			if( matrix !== undefined ){
			
				box.updateMatrix()
				box.matrix.multiply( matrix )
			}
			else {

				box.position.y += 1
			}
			handRoot.add( box )
		})
		handRoot.position.copy( hand.position )
		hand.camera.parent.add( handRoot )
	},


	//  We can also show previously recorded poses.

	showPoseByName: function( poseName, matrix ){

		const
		hand  = this,
		pose = Handy.poses[ hand.handedness ]
		.find( function( pose ){ 

			return pose.names.includes( poseName )
		})

		if( pose ) hand.showPose( pose, matrix )
	},






	    ////////////////
	   //            //
	  //   Search   //
	 //            //
	////////////////


	//  Upon casually discussing Handy with a good friend of mine,
	//  Robert Gerard Pietrusko (http://warning-office.org),
	//  he suggessted I try recording hand poses and measuring the
	//  Euclidean distance between them.
	//  https://en.wikipedia.org/wiki/K-means_clustering
	//  This turned out to be very efficient! Sort of like Word2Vec,
	//  but for hands. https://en.wikipedia.org/wiki/Word2vec
	//
 	//  Question is, do we try Cosine Distance in the future?
	//  https://cmry.github.io/notes/euclidean-v-cosine

	livePoseData: [],
	searchLoopBeganAt: null,
	searchLoopsCounter: 0,
	searchLoopsCounterMax: 0,
	searchPoseIndex: 0,
	searchResultsBuffer:  [],
	searchResults: [],
	searchResultsHistory: [],//  For future use. (Will add gesture recognition.)
	searchMethod: 'jointPositions',
	lastSearchResult: { name: 'null' },

	search: function(){
		
		const 
		hand   = this,
		handedness = hand.checkHandedness(),
		poses = Handy.poses[ handedness ],
		method = hand.searchMethod


		//  Is our handedness undefined?
		//  Do we have zero poses to detect?
		//  If so, bail immediately!

		if( poses === undefined || poses.length === 0 ) return


		//  We’re going to do some serious “Array clutching” here.
		//  That means we may NOT finish looping through the Array
		//  before we “run out of time.” Why do this? Because if we’re
		//  running at 72fps or 90fps, etc. and we really only need
		//  to do a full poses search a few times per second,
		//  then we have render loops to spare and we ought to get
		//  out of the way as quickly as possible so that YOU can
		//  use that render loop time for yourself :)

		//  If you want more performance than this, then it’s time
		//  for Web Workers. But for now this seems to do the trick.
		//  https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API

		hand.searchLoopBeganAt = window.performance.now()
		for( let 
			
			i = hand.searchPoseIndex; 
			i < poses.length; 
			i ++ 
		){
		

			//  If we’re just beginning a new search
			//  we need to reset our results buffer
			//  and ask for new live hand pose data.

			if( i === 0 ){

				hand.searchLoopsCounter = 0
				hand.searchResultsBuffer = []
				hand.livePoseData = hand.readLivePoseData()


				//  If there’s no joint position data
				//  or if the wrist position of this hand is EXACTLY zero 
				// (in which case it’s likely ALL joint positions are zero)
				//  then this live data is useless. (So bail!)

				if( hand.livePoseData.jointPositions.length === 0 ||
					( 
						hand.livePoseData.jointPositions[ 0 ][ 0 ] === 0 &&
						hand.livePoseData.jointPositions[ 0 ][ 1 ] === 0 &&
						hand.livePoseData.jointPositions[ 0 ][ 2 ] === 0
					)){

					return
				}


				//  These flags assert that we are 
				//  NOT taking the square root of each distance.
				//  As this might change in the future
				//  I wanted a way for you to query / write logic
				//  around that.
				
				hand.searchResultsBuffer.distancesAreSquared = true
				hand.searchResultsBuffer.distancesAreRooted  = false
			}
	

			//  Go about our normal business.
			//  eg, evaluate the distance between this hand pose
			//  and the current-ish state of our real hand.

			const pose = poses[ i ]


			//  Currently we have two methods for detecting poses.
			// (Down from FOUR in a previous iteration! Sadly,
			//  the angles between wrist quaternion and digit tip
			//  weren’t sufficient once we added all of ASL.)
			//  We may eventually remove this digitTipPositions method
			//  as [all] jointPositions is obviously more accurate
			//  and seems speedy enough. 

			if( method === 'digitTipPositions' ){
				
				hand.searchResultsBuffer.push({

					pose,
					distance: pose.digitTipPositions
					.reduce( function( distance, digitTipPosition, i ){

						if( digitTipPosition.length !== undefined && 
							hand.livePoseData.digitTipPositions[ i ] !== undefined &&
							hand.livePoseData.digitTipPositions[ i ].length > 0 ){


							//  The “correct” way to do this is to take the square root
							//  of this sum. But find a square root is inherently slow.
							//  Thankfully we can do just as well by NOT taking the root.
							//  I leave it here (commented out) for your edification ;)

							distance += //Math.sqrt(

								Math.pow( digitTipPosition[ 0 ] - hand.livePoseData.digitTipPositions[ i ][ 0 ], 2 ) +
								Math.pow( digitTipPosition[ 1 ] - hand.livePoseData.digitTipPositions[ i ][ 1 ], 2 ) +
								Math.pow( digitTipPosition[ 2 ] - hand.livePoseData.digitTipPositions[ i ][ 2 ], 2 )
							//)
						}
						return distance

					}, 0 )
				})
			}
			else if( method === 'jointPositions' ){

				hand.searchResultsBuffer.push({

					pose,
					distance: pose.jointPositions
					.reduce( function( distance, jointPosition, i ){

						if( jointPosition.length !== undefined && 
							hand.livePoseData.jointPositions[ i ] !== undefined &&
							hand.livePoseData.jointPositions[ i ].length > 0 ){


							//  The “correct” way to do this is to take the square root
							//  of this sum. But find a square root is inherently slow.
							//  Thankfully we can do just as well by NOT taking the root.
							//  I leave it here (commented out) for your edification ;)

							distance += //Math.sqrt(

								Math.pow( jointPosition[ 0 ] - hand.livePoseData.jointPositions[ i ][ 0 ], 2 ) +
								Math.pow( jointPosition[ 1 ] - hand.livePoseData.jointPositions[ i ][ 1 ], 2 ) +
								Math.pow( jointPosition[ 2 ] - hand.livePoseData.jointPositions[ i ][ 2 ], 2 )
							//)
						}
						return distance

					}, 0 )
				})
			}


			//  Let’s keep track of how many loops it’s taking
			//  to finish searching through our whole poses library;
			//  accessible with something like:
			//  Handy.hands.getLeft().searchLoopsCounterMax

			hand.searchLoopsCounter ++
			hand.searchLoopsCounterMax = Math.max(

				hand.searchLoopsCounterMax,
				hand.searchLoopsCounter
			)


			//  Are we done? (If so, shut it down.)

			if( i === poses.length - 1 ){

				hand.searchResults = hand.searchResultsBuffer
				.sort( function( a, b ){

					return a.distance - b.distance
				})
				const searchResult = hand.searchResults[ 0 ]


				//   Does this search result differ from the previous one?

				if( hand.lastSearchResult.pose !== searchResult.pose ){

					if( hand.lastSearchResult && hand.lastSearchResult.pose ){


						

						hand.lastSearchResult.pose.names
						.forEach( function( poseName ){

							hand.dispatchEvent({

								type: poseName +' pose ended', 
								hand,
								pose: hand.lastSearchResult.pose,
								

								//  Open question here:
								//  Should this “distance” property be from this pose’s
								//  previous top-result status (as it is currently)
								//  or should it be from its new not-top-result status?
	
								distance: hand.lastSearchResult.distance,
								message:  hand.handedness.toUpperCase() +
									' hand “'+ poseName +'” pose ended'+
									' at a Euclidean distance of '+ hand.lastSearchResult.distance +'mm.'
							})
						})

						
						//  Should you need it, 
						//  here’s an easy way to get a “from / to” alert.
						//  NOTE: Do we need to include distances in here too?

						hand.dispatchEvent({

							type: 'pose changed', 
							hand,
							resultWas: hand.lastSearchResult,
							resultIs:  searchResult,
							message:   hand.handedness.toUpperCase() +
								' hand pose changed from '+ 
								JSON.stringify( hand.lastSearchResult.pose.names ) +
								' to '+ 
								JSON.stringify( searchResult.pose.names ) +'.'
						})
					}
					

					searchResult.pose.names
					.forEach( function( poseName ){

						hand.dispatchEvent({

							type: poseName +' pose began', 
							hand,
							pose:     searchResult.pose,
							distance: searchResult.distance,
							message:  hand.handedness.toUpperCase() +
								' hand “'+ poseName +'” pose began'+
								' at a Euclidean distance of '+ searchResult.distance +'mm.'
						})
					})


					//  We’re ready to make it final.
					//  Replace the prior searh result 
					//  with the current search result.

					hand.lastSearchResult = searchResult
				}
				else {

					// console.log( 'Same hand pose as last time' )
				}
				

				//  Get things ready for next search.

				hand.searchIndex = 0
				hand.searchResultsBuffer = []


				//  Bail both from this local “for” loop 
				//  and from this entire function.

				return searchResult
			}

		
			//  If we’re not done with our search, 
			//  check if this search is taking too long per update() loop.

			else {


				//  If we’re taking too long
				//  let’s note what index we should start at next time
				//  and bail for now.

				if( window.performance.now() 
					- hand.searchLoopBeganAt 
					> Handy.searchLoopDurationLimit ){

					hand.findPoseIndex = i + 1
					break
				}
			}
		}
	},




	isPose: function( poseName, threshold ){

		const hand = this
		if( typeof threshold === 'number' ){
			
			const result = hand.searchResults
			.find( function( result ){ 

				return (

					result.distance <= threshold &&
					result.pose.names.includes( poseName )
				)
			})
			return result ? result : false
		}
		else if( hand.searchResults.length ){

			return hand.searchResults[ 0 ].pose.names.includes( poseName ) ?
				hand.searchResults[ 0 ] :
				false
		}
		return false
	},




	//  Some leftover debugging functions.

	comparePoses: function( poseAName, poseBName ){

		const 
		hand = this,
		posesList = Handy.poses[ hand.handedness ],
		poseA = posesList.find( function( pose ){ return pose.name === poseAName }),
		poseB = posesList.find( function( pose ){ return pose.name === poseBName })
		
		let
		poseDistanceAbs = 0,
		poseDistanceSqr = 0

		for( let i = 0; i < poseA.positions.length; i ++ ){

			const 
			positionA = poseA.positions[ i ],
			positionB = poseB.positions[ i ],
			jointDistanceAbs = 
				Math.abs( positionA[ 0 ] - positionB[ 0 ]) +
				Math.abs( positionA[ 1 ] - positionB[ 1 ]) +
				Math.abs( positionA[ 2 ] - positionB[ 2 ]),
			jointDistanceSqr = Math.sqrt(
				
				Math.pow( positionA[ 0 ] - positionB[ 0 ], 2 ) +
				Math.pow( positionA[ 1 ] - positionB[ 1 ], 2 ) +
				Math.pow( positionA[ 2 ] - positionB[ 2 ], 2 )
			)
			
			

			poseDistanceAbs += jointDistanceAbs
			poseDistanceSqr += jointDistanceSqr
		}
		console.log( 

			'\nThe distance between', poseAName, 'and', poseBName, 'is', 
			'\nAbs:', poseDistanceAbs, 
			'\nSqr:', poseDistanceSqr, 
			'\n\n'
		)
		return poseDistanceSqr
	},
	compareAllTo: function( inputPose ){
		
		const
		hand = this,
		posesList = Handy.poses[ hand.handedness ]

		return posesList
		.reduce( function( list, pose ){ 

			return list.concat({ 

				name: pose.name, 
				distance: hands.left.comparePoses( 'Fist', pose.name )
			})

		}, [])
		.sort( function( a, b ){ 

			return a.distance - b.distance
		})
	},






	    ////////////////
	   //            //
	  //   Update   //
	 //            //
	////////////////




	update: function( callback ){

		const hand = this

		

		hand.search()


		
		
		if( typeof callback === 'function' ) callback( hand )
	}
})






console.log( '\n\n👋 Handy (rev '+ Handy.REVISION +')\n\n\n' )
export { Handy }




