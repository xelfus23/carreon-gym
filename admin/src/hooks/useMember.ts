import { useCallback, useEffect, useState } from "react";
import { memberService } from "../services/member.service";
import type { AdminMemberListItem } from "../types";

export const useMember = () => {
    const [members, setMembers] = useState<AdminMemberListItem[]>([]);

    const refetch = useCallback(async () => {
        try {
            const result = await memberService.getMember();
            setMembers(result.data ?? []);
        } catch (err) {
            if (err instanceof Error) console.log(err.message);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const fetchMembers = async () => {
            try {
                const result = await memberService.getMember();
                if (!cancelled) setMembers(result.data ?? []);
            } catch (err) {
                if (err instanceof Error) console.log(err.message);
            }
        };

        fetchMembers();

        return () => {
            cancelled = true;
        };
    }, []);

    return {
        members,
        refetch,
    };
};
