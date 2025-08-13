"use client";
import React, { useState } from "react";
import axios from "axios";

export default function BSBComponent() {
  const [bsb, setBsb] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");

  const handleBsbChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, ""); // remove non-digits
    if (value.length > 3) {
      value = value.slice(0, 3) + "-" + value.slice(3, 6); // insert dash
    }
    setBsb(value);

    // If BSB is full length, verify it
    if (value.length === 7) {
      verifyBSB(value);
    } else {
      setResult("");
      setStatus("");
    }
  };

  const verifyBSB = async (bsbNumber) => {
    try {
      const res = await axios.post("/api/verifyBSB", { bsb: bsbNumber });
      setResult(res.data.bankName);
      setStatus("success");
    } catch (err) {
      setResult("Invalid BSB");
      setStatus("error");
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200 mt-6">
      <label className="block text-gray-700 font-semibold mb-2 text-sm">
        Bank BSB
      </label>
      <input
        type="text"
        value={bsb}
        onChange={handleBsbChange}
        placeholder="XXX-XXX"
        maxLength={7}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        style={{ width: "104px" }}
      />

      {result && (
        <p
          className={`mt-3 text-sm font-medium ${
            status === "success" ? "text-green-700" : "text-red-700"
          }`}
        >
          {result}
        </p>
      )}
    </div>
  );
}
