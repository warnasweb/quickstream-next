"use client";

import { useState } from "react";

// --- Monthly Logic ---
function getMonthlyDeferralDates(year, month) {
  const start = new Date(year, month, 25);      // 25th of selected month
  const end = new Date(year, month + 1, 22);    // 22nd of next month

  const validDates = [];
  let iter = new Date(start);

  while (iter <= end) {
    const day = iter.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu
    if (day === 2 || day === 4) {
      validDates.push(new Date(iter));
    }
    iter.setDate(iter.getDate() + 1);
  }

  return { dueDate: new Date(year, month, 24), validDates };
}

// --- Fortnightly Logic ---
function getFortnightlyDeferralDates(lastPaymentDate) {
  if (!lastPaymentDate) return { dueDate: null, nextDueDate: null, validDates: [] };

  const baseDate = new Date(lastPaymentDate);

  const firstDueDate = new Date(baseDate);
  firstDueDate.setDate(firstDueDate.getDate() + 14); // first DDR

  const secondDueDate = new Date(firstDueDate);
  secondDueDate.setDate(secondDueDate.getDate() + 14); // next DDR

  const start = new Date(baseDate);
  start.setDate(start.getDate() + 1); // day after last payment

  const end = new Date(secondDueDate);
  end.setDate(end.getDate() - 2); // 2 days before next DDR

  const validDates = [];
  let iter = new Date(start);

  while (iter <= end) {
    const day = iter.getDay();
    if (day === 2 || day === 4) { // Tue / Thu
      validDates.push(new Date(iter));
    }
    iter.setDate(iter.getDate() + 1);
  }

  return { dueDate: firstDueDate, nextDueDate: secondDueDate, validDates };
}

export default function DDRDeferralPicker() {
  const today = new Date();

  // Monthly state
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  // Fortnightly state
  const [lastPaymentDate, setLastPaymentDate] = useState("");

  const [selectedDate, setSelectedDate] = useState("");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const monthly = getMonthlyDeferralDates(selectedYear, selectedMonth);
  const fortnightly = getFortnightlyDeferralDates(lastPaymentDate);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow space-y-8">
      <h2 className="text-2xl font-bold mb-4">Defer Your DDR Payment</h2>

      {/* --- Monthly Block --- */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">📅 Monthly DDR</h3>

        <div className="flex gap-2 mb-4">
          <select
            className="border p-2 rounded-lg w-1/2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <select
            className="border p-2 rounded-lg w-1/2"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => today.getFullYear() + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-600 mb-2">
          Original DDR Date: {monthly.dueDate.toLocaleDateString("en-AU", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        {selectedMonth === today.getMonth() &&
         selectedYear === today.getFullYear() &&
         today.getDate() > 22 ? (
          <p className="text-red-600 font-medium">
            ❌ Deferral not allowed after 22nd of this month.
          </p>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">Allowed Defer Dates:</label>
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
          </div>
        )}
      </div>

      {/* --- Fortnightly Block --- */}
      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">📅 Fortnightly DDR</h3>

        <label className="block text-sm font-medium mb-2">Last Payment Date:</label>
        <input
          type="date"
          className="border p-2 rounded-lg mb-4 w-full"
          value={lastPaymentDate}
          onChange={(e) => setLastPaymentDate(e.target.value)}
        />

        {fortnightly.dueDate && (
          <p className="text-sm text-gray-600 mb-2">
            First DDR Date: {fortnightly.dueDate.toLocaleDateString("en-AU", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            <br />
            Next DDR Date: {fortnightly.nextDueDate.toLocaleDateString("en-AU", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {fortnightly.validDates.length > 0 ? (
          <div>
            <label className="block text-sm font-medium mb-2">Allowed Defer Dates:</label>
            <ul className="list-disc pl-5">
              {fortnightly.validDates.map((date) => (
                <li key={date.toISOString()}>
                  {date.toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          lastPaymentDate && (
            <p className="text-red-600 font-medium">
              ❌ No valid defer dates (must be Tue/Thu before next DDR).
            </p>
          )
        )}
      </div>
    </div>
  );
}
