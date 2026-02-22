import { View, Text, ScrollView } from "react-native";
import React from "react";
import { useWorkout } from "@/src/hooks/useWorkout";
import {
    PlansLoading,
    PlansEmpty,
    PlanCard,
    LogExerciseModal,
} from "../../components/Plans";

export default function Plans() {
    const {
        workoutPlans,
        isLoading,
        expandedPlan,
        expandedDay,
        checkedExercises,
        loadingDays,
        modal,
        formSets,
        setFormSets,
        formReps,
        setFormReps,
        formDuration,
        setFormDuration,
        formWeight,
        setFormWeight,
        formDifficulty,
        setFormDifficulty,
        isSaving,
        togglePlan,
        toggleDay,
        getDayProgress,
        isDayComplete,
        isExerciseChecked,
        openLogModal,
        closeModal,
        uncheckExercise,
        saveLog,
        logKey,
    } = useWorkout();

    if (isLoading) {
        return <PlansLoading />;
    }

    if (workoutPlans.length === 0) {
        return <PlansEmpty />;
    }

    return (
        <>
            <ScrollView
                className="flex-1 bg-background"
                showsVerticalScrollIndicator={false}
            >
                <View className="p-4 gap-4">
                    <View className="mb-2">
                        <Text className="text-text-primary font-bold text-2xl">
                            My Workout Plans
                        </Text>
                        <Text className="text-text-secondary text-sm mt-1">
                            {workoutPlans.length}{" "}
                            {workoutPlans.length === 1 ? "plan" : "plans"} saved
                        </Text>
                    </View>

                    {workoutPlans.map((plan, planIndex) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            planIndex={planIndex}
                            isExpanded={expandedPlan === plan.id}
                            expandedDay={expandedDay}
                            loadingDays={loadingDays}
                            checkedExercises={checkedExercises}
                            logKey={logKey}
                            getDayProgress={getDayProgress}
                            isDayComplete={isDayComplete}
                            isExerciseChecked={isExerciseChecked}
                            onTogglePlan={togglePlan}
                            onToggleDay={toggleDay}
                            onOpenLogModal={openLogModal}
                            onUncheckExercise={uncheckExercise}
                        />
                    ))}
                </View>
                <View className="h-6" />
            </ScrollView>

            <LogExerciseModal
                modal={modal}
                formSets={formSets}
                formReps={formReps}
                formDuration={formDuration}
                formWeight={formWeight}
                formDifficulty={formDifficulty}
                isSaving={isSaving}
                onSetFormSets={setFormSets}
                onSetFormReps={setFormReps}
                onSetFormDuration={setFormDuration}
                onSetFormWeight={setFormWeight}
                onSetFormDifficulty={setFormDifficulty}
                onClose={closeModal}
                onSave={saveLog}
            />
        </>
    );
}
