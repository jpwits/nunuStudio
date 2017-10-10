"use strict";

/**
 * Spine animation object, to used with animation produced inside Esoteric spine.
 * 
 * Based on the official threejs runtime code available at https://github.com/EsotericSoftware/spine-runtimes.
 * 
 * More information abou spine available here www.esotericsoftware.com.
 * 
 * @class SpineAnimation
 * @constructor
 * @extends {spine.threejs.SkeletonMesh}
 * @param {Object} json
 * @param {String} atlas
 * @param {String} path
 * @param {Array} textures
 * @module Animations
 */

/**
 * Array of SpineTextures used by the animation.
 * @property textures
 * @type {Array}
 */
/**
 * Animation data.
 * @property json
 * @type {Object}
 */
/**
 * Texture atlas information.
 * @property atlas
 * @type {Object}
 */
function SpineAnimation(json, atlas, path, textures)
{
	if(textures !== undefined)
	{
		var textureAtlas = new spine.TextureAtlas(atlas, function(file)
		{
			for(var i = 0; i < textures.length; i++)
			{
				if(textures[i].name === file)
				{
					var texture = new SpineTexture(textures[i].texture);
					var image = texture.texture.image;
					image.width = 1024;
					image.height = 1024;
					return texture;
				}
			}
		});
	}
	else
	{
		textures = [];
		
		var textureAtlas = new spine.TextureAtlas(atlas, function(file)
		{
			var texture = new SpineTexture(new Texture(new Image(path + "/" + file)));
			var image = texture.texture.image;
			image.width = 1024;
			image.height = 1024;

			textures.push({name: file, texture: texture.texture});
			return texture;
		});
	}

	var loader = new spine.AtlasAttachmentLoader(textureAtlas);
	var skeleton = new spine.SkeletonJson(loader).readSkeletonData(json);

	spine.threejs.SkeletonMesh.call(this, skeleton);

	//Attributes
	this.name = "spine";
	this.type = "SpineAnimation";
	this.frustumCulled = false;
	this.receiveShadow = true;
	this.castShadow = true;
	this.scale.set(0.01, 0.01, 0.01);

	//Animation
	this.json = json;
	this.atlas = atlas;
	this.textures = textures;

	//Default animation and skin
	this.skin = null;
	this.animation = null;

	//Runtime control
	this.clock = new THREE.Clock();
}

SpineAnimation.prototype = Object.create(spine.threejs.SkeletonMesh.prototype);

SpineAnimation.prototype.initialize = function()
{
	THREE.Object3D.prototype.initialize.call(this);
};

/**
 * Update mesh geometry from animation state before rendering.
 * 
 * @method onBeforeRender
 */
SpineAnimation.prototype.onBeforeRender = function()
{
	this.state.update(this.clock.getDelta());
	this.state.apply(this.skeleton);
	this.skeleton.updateWorldTransform();
	this.updateGeometry();
};

/**
 * Get all available animations.
 * 
 * @method getAnimations
 * @return {Array} Animations
 */
SpineAnimation.prototype.getAnimations = function()
{
	return this.state.data.skeletonData.animations;
}

/**
 * Set animation from track number and name.
 * 
 * @method setAnimation
 * @param {Number} track Track number
 * @param {String} name Animation name
 */
SpineAnimation.prototype.setAnimation = function(track, name, loop)
{
	try
	{
		this.state.setAnimation(track, name, loop !== undefined ? loop : true);
		this.animation = [track, name, loop];
	}
	catch(e)
	{
		this.animation = null;
		console.warn("nunuStudio: Error setting spine animation " + name + " on track " + track);
	}
};

/**
 * Get skins available for this animation.
 *
 * @method getSkins
 * @return {Array} List of skins available for this animation.
 */
SpineAnimation.prototype.getSkins = function()
{
	return this.state.data.skeletonData.skins;
};

/**
 * Set skin to be used by this animation
 *
 * @method setSkin
 * @param {String} name Skin name.
 */
SpineAnimation.prototype.setSkin = function(name)
{
	try
	{
		this.skeleton.setSkinByName(name);
		this.skin = name;
	}
	catch(e)
	{
		this.skin = null;
		console.warn("nunuStudio: Error setting spine skin " + name);
	}
};

/**
 * Serialize spine animation as JSON.
 *
 * @method toJSON
 * @param {Object} meta
 * @return {Object} json
 */
SpineAnimation.prototype.toJSON = function(meta)
{
	//Avoid serializing geometry and material
	var geometry = this.geometry;
	var material = this.material;
	this.geometry = undefined;
	this.material = undefined;
	
	//Store textures
	var textures = [];
	var self = this;
	var data = THREE.Object3D.prototype.toJSON.call(this, meta, function(meta, object)
	{
		for(var i = 0; i < self.textures.length; i++)
		{
			var texture = self.textures[i].texture.toJSON(meta);
			textures.push({name: self.textures[i].name, texture: texture.uuid});
		}
	});

	//Animation data
	data.object.json = this.json;
	data.object.atlas = this.atlas;
	data.object.textures = textures;

	//Default animation and skin
	if(this.animation !== null)
	{
		data.object.animation = this.animation;	
	}
	if(this.skin !== null)
	{
		data.object.skin = this.skin;	
	}

	//Restore geometry and material
	this.geometry = geometry;
	this.material = material;

	return data;
};
