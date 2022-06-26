import Joi from '@hapi/joi'

const authSchema2=Joi.object().keys({
    to:Joi.string().required(),
    text:Joi.string().required().trim(),
    from:Joi.string().max(1),
    type:Joi.string().valid('message','private_message'),
    
})

export default authSchema2