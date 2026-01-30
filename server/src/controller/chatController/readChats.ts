import type {Request,  Response } from 'express'

const readChat = async (req:Request, res:Response) => {

    try {
        
    }catch(err){
        if(err instanceof Error) {
            console.error(err.message)
            return res.status(500).json({error: err.message})
        }
    }
}

export default readChat