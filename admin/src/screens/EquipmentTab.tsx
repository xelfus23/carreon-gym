import { useEquipments } from "../hooks/useEquipments";

export default function EquipmentTab() {
    const { equipments } = useEquipments();

    return (
        <div>
            {equipments.map((v) => (
                <div>
                    <p>{v.equipment_name}</p>
                </div>
            ))}
        </div>
    );
}
