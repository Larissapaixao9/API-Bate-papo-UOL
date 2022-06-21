import Joi from '@hapi/joi'

const authSchema=Joi.object().keys({
    name:Joi.string().required()
})

export default authSchema