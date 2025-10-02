"use client";

import { useState } from "react";

function getMonthlyDeferralDates(selectedYear, selectedMonth, today) {
  const dueDate = new Date(selectedYear, selectedMonth, 24);
  const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

  // Bill generation cutoff
  if (
    today.getFullYear() === selectedYear &&
    today.getMonth() === selectedMonth &&
    today.getDate() < 5
  ) {
    return {
      dueDate,
      validDates: [],
      status: "❌ No deferral allowed before 4th (bill not generated)",
      window: null,
    };
  }

  const cutoff = new Date(selectedYear, selectedMonth, 22); // DDR-2

  // If in lockout or after DDR → no deferral
  if (today >= cutoff) {
    return {
      dueDate,
      validDates: [],
      status: "❌ No deferral allowed (within lockout or past DDR)",
      window: null,
    };
  }

  // Otherwise allow from tomorrow → end of month (excluding DDR itself)
  let start = new Date(today);
  start.setDate(start.getDate() + 1);

  const validDates = [];
  let iter = new Date(start);

  while (iter <= endOfMonth) {
    const day = iter.getDay(); // Tue=2, Thu=4
    const isDDR = iter.getDate() === 24;
    if ((day === 2 || day === 4) && !isDDR && iter > today) {
      validDates.push(new Date(iter));
    }
    iter.setDate(iter.getDate() + 1);
  }

  return {
    dueDate,
    validDates,
    status: validDates.length
      ? "✅ Deferral allowed"
      : "❌ No valid defer dates",
    window: { start, end: endOfMonth },
  };
}

export default function MonthlyDDRPicker() {
  const [todayDate, setTodayDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const today = new Date(todayDate);

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const monthly = getMonthlyDeferralDates(selectedYear, selectedMonth, today);

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <h3 className="font-semibold mb-4">📅 Monthly DDR</h3>

      {/* Today date input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Today’s Date:</label>
        <input
          type="date"
          className="border p-2 rounded-lg w-full"
          value={todayDate}
          onChange={(e) => setTodayDate(e.target.value)}
        />
      </div>

      {/* Month + Year selectors */}
      <div className="flex gap-2 mb-4">
        <select
          className="border p-2 rounded-lg w-1/2"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
        >
          {months.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded-lg w-1/2"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
        >
          {Array.from({ length: 5 }, (_, i) => today.getFullYear() + i).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
        </select>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        DDR Date:{" "}
        {monthly.dueDate.toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        <br />
        Deferral allowed until 2 days before DDR (22nd in this case).
      </p>

      <p className="text-sm font-medium mb-2">{monthly.status}</p>

      {monthly.window && (
        <p className="text-xs text-gray-500 mb-2">
          Allowed Window: {monthly.window.start.toLocaleDateString("en-AU")} →{" "}
          {monthly.window.end.toLocaleDateString("en-AU")}
        </p>
      )}

      {monthly.validDates.length > 0 ? (
        <ul className="list-disc pl-5">
          {monthly.validDates.map((date) => (
            <li key={date.toISOString()}>
              {date.toLocaleDateString("en-AU", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-red-600 font-medium">❌ No valid defer dates.</p>
      )}
    </div>
  );
}
