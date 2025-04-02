const joiObjectid = require("joi-objectid");
const AlertService = require("../Utils/alert");
const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
class AlertController{
    constructor(io){
        this.AlertService = new AlertService(io)
    }
    async getUnread(req,res,next){
        const alert = await this.AlertService.getUnread(req.tokenPayload.id);
        if(!alert){
            res.status(404).json("alerts not found");
            return;
        }
        res.status(200).json(alert);
    }
}
module.exports=AlertController;