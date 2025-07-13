import Joi from 'joi';

const episodeSchema = Joi.object({
  id: Joi.string().required(),
  episode_number: Joi.number().integer().min(1).required(),
  title: Joi.string().max(200).required(),
  show_name: Joi.string().default('CRO CAFÉ')
});

const personSchema = Joi.object({
  name: Joi.string().max(50).required(),
  title: Joi.string().max(100).allow(''),
  company: Joi.string().max(100).allow(''),
  image_url: Joi.string().uri().allow(''),
  linkedin_profile_pic: Joi.string().uri().allow(''),
  picture: Joi.string().uri().allow('')
});

const canvasSchema = Joi.object({
  width: Joi.number().integer().min(1400).max(3000).default(3000),
  height: Joi.number().integer().min(1400).max(3000).default(3000),
  format: Joi.string().valid('jpeg', 'png').default('jpeg'),
  quality: Joi.number().integer().min(60).max(100).default(85)
});

const requestSchema = Joi.object({
  episode: episodeSchema.required(),
  hosts: Joi.array().items(personSchema).min(1).max(2).required(),
  guests: Joi.array().items(personSchema).max(3).default([]),
  canvas: canvasSchema.default()
});

export function validateRequest(data) {
  return requestSchema.validate(data, { 
    abortEarly: false,
    allowUnknown: false 
  });
}