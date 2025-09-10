import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function JourneyDashboard() {
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('goal_text');

      if (error) {
        console.error('Error fetching goals:', error);
      } else {
        setGoals(data.map((goal) => goal.goal_text));
      }
    };

    fetchGoals();
  }, []);

  const addGoal = async () => {
    if (newGoal.trim()) {
      const { error } = await supabase
        .from('goals')
        .insert([{ goal_text: newGoal.trim() }]);

      if (error) {
        console.error('Error adding goal:', error);
      } else {
        setGoals([...goals, newGoal.trim()]);
        setNewGoal('');
      }
    }
  };

  const removeGoal = async (index: number) => {
    const goalToRemove = goals[index];

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('goal_text', goalToRemove);

    if (error) {
      console.error('Error removing goal:', error);
    } else {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Learning Journey</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Set Your Goals</h2>
        <div className="flex items-center mt-2">
          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Enter a new goal"
            className="border p-2 rounded w-full"
          />
          <button
            onClick={addGoal}
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Goal
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Your Goals</h2>
        {goals.length > 0 ? (
          <ul className="mt-2">
            {goals.map((goal, index) => (
              <li
                key={index}
                className="flex justify-between items-center border p-2 rounded mb-2"
              >
                <span>{goal}</span>
                <button
                  onClick={() => removeGoal(index)}
                  className="text-red-500 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 mt-2">No goals set yet. Start by adding one!</p>
        )}
      </div>
    </div>
  );
}
