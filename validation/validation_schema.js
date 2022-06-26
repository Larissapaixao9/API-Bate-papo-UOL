import Joi from '@hapi/joi'

const authSchema=Joi.object().keys({
    name:Joi.string().required().trim()
})

export default authSchema