"use client";

import { useState } from "react";

function getFortnightlyDeferralDates(lastPaymentDate, currentDate) {
  if (!lastPaymentDate || !currentDate)
    return { cycles: [], validDates: [], status: "❌ Missing inputs", window: null };

  const baseDate = new Date(lastPaymentDate);
  const today = new Date(currentDate);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Bill generation rule
  if (today.getDate() < 5) {
    return {
      cycles: [],
      validDates: [],
      status: "❌ No deferral allowed before 4th (bill not generated)",
      window: null,
    };
  }

  // Find first DDR in current month
  let cycle1 = new Date(baseDate);
  while (cycle1 < monthStart) {
    cycle1.setDate(cycle1.getDate() + 14);
  }
  const cycle2 = new Date(cycle1);
  cycle2.setDate(cycle2.getDate() + 14);
  const cycle3 = new Date(cycle2);
  cycle3.setDate(cycle3.getDate() + 14);

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Helper: check lockout window for a DDR (inclusive of DDR day)
  function inLockout(ddr, date) {
    const lockoutStart = new Date(ddr);
    lockoutStart.setDate(ddr.getDate() - 2);
    return date >= lockoutStart && date <= ddr;
  }

  let cycleStage = "";
  let start, end;

  if (today < cycle1) {
    if (inLockout(cycle1, today)) {
      return {
        cycles: [cycle1, cycle2, cycle3],
        validDates: [],
        status: "❌ In lockout around Cycle 1",
        window: null,
      };
    }
    cycleStage = "pre-cycle";
    start = new Date(today);
    start.setDate(start.getDate() + 1);
    end = new Date(cycle1);
    end.setDate(end.getDate() - 2);
  } else if (today >= cycle1 && today < cycle2) {
    if (inLockout(cycle1, today)) {
      return {
        cycles: [cycle1, cycle2, cycle3],
        validDates: [],
        status: "❌ In lockout around Cycle 1",
        window: null,
      };
    }
    cycleStage = "first";
    start = new Date(today);
    start.setDate(start.getDate() + 1);
    // Extend to end of month (or 2 days before cycle3 if within same month)
    if (cycle3.getMonth() === today.getMonth()) {
      end = new Date(cycle3);
      end.setDate(end.getDate() - 2);
    } else {
      end = endOfMonth;
    }
  } else if (today >= cycle2 && today < cycle3) {
    if (inLockout(cycle2, today)) {
      return {
        cycles: [cycle1, cycle2, cycle3],
        validDates: [],
        status: "❌ In lockout around Cycle 2",
        window: null,
      };
    }
    cycleStage = "second";
    start = new Date(today);
    start.setDate(start.getDate() + 1);
    if (cycle3.getMonth() === today.getMonth()) {
      end = new Date(cycle3);
      end.setDate(end.getDate() - 2);
    } else {
      end = endOfMonth;
    }
  } else {
    return {
      cycles: [cycle1, cycle2, cycle3],
      validDates: [],
      status: "❌ No deferral allowed in 3rd cycle or later",
      window: null,
    };
  }

  // Collect valid Tue/Thu > today, exclude DDRs and lockout ranges
  const validDates = [];
  let iter = new Date(start);

  while (iter <= end) {
    const day = iter.getDay(); // Tue=2, Thu=4

    const isDDR = [cycle1, cycle2, cycle3].some(
      (c) => iter.toDateString() === c.toDateString()
    );

    if (
      (day === 2 || day === 4) &&
      iter > today &&
      !isDDR &&
      !inLockout(cycle1, iter) &&
      !inLockout(cycle2, iter)
    ) {
      validDates.push(new Date(iter));
    }
    iter.setDate(iter.getDate() + 1);
  }

  return {
    cycles: [cycle1, cycle2, cycle3],
    validDates,
    status: `✅ Deferral allowed in ${cycleStage} cycle`,
    window: { start, end },
  };
}

export default function FortnightlyDDRPicker() {
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split("T")[0]);
  const [lastPaymentDate, setLastPaymentDate] = useState("");

  const fortnightly = getFortnightlyDeferralDates(lastPaymentDate, todayDate);

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <h3 className="font-semibold mb-4">📅 Fortnightly DDR</h3>

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

      {/* Last Payment Date input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Last Payment Date:</label>
        <input
          type="date"
          className="border p-2 rounded-lg w-full"
          value={lastPaymentDate}
          onChange={(e) => setLastPaymentDate(e.target.value)}
        />
      </div>

      {fortnightly.cycles.length > 0 && (
        <p className="text-sm text-gray-600 mb-2">
          Cycle 1: {fortnightly.cycles[0].toLocaleDateString("en-AU")} <br />
          Cycle 2: {fortnightly.cycles[1].toLocaleDateString("en-AU")} <br />
          Cycle 3: {fortnightly.cycles[2].toLocaleDateString("en-AU")}
        </p>
      )}

      <p className="text-sm font-medium mb-2">{fortnightly.status}</p>

      {fortnightly.window && (
        <p className="text-xs text-gray-500 mb-2">
          Allowed Window: {fortnightly.window.start.toLocaleDateString("en-AU")} →{" "}
          {fortnightly.window.end.toLocaleDateString("en-AU")}
        </p>
      )}

      {fortnightly.validDates.length > 0 ? (
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
      ) : (
        lastPaymentDate && (
          <p className="text-red-600 font-medium">❌ No valid defer dates.</p>
        )
      )}
    </div>
  );
}
