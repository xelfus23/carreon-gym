import pool from "../../config/pool.ts";

export const deleteMessageDomain = async (params: {
    userId: number;
    messageId: number;
}) => {
    const { messageId, userId } = params;

    const result = await pool.query(
        `
    DELETE FROM chat_messages
    WHERE id = $1 AND user_id = $2
    RETURNING id
    `,
        [messageId, userId],
    );

    if (result.rowCount === 0) {
        throw new Error("Message not found or access denied");
    }

    return messageId;
};
