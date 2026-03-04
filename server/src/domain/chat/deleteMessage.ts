import pool from "../../config/pool.ts";
import { AppError } from "../../utils/appError.ts";

export const deleteMessageDomain = async (params: {
    userId: number;
    messageId: number;
}) => {
    const { messageId, userId } = params;

    const result = await pool.query(
        `
    DELETE FROM 
        chat_messages
    WHERE 
        id = $1 
    AND 
        user_id = $2
    RETURNING 
        id
    `,
        [messageId, userId],
    );

    if (result.rowCount === 0) {
        throw new AppError("Message not found or access denied", 400, "NOT_FOUND");
    }

    return messageId;
};
