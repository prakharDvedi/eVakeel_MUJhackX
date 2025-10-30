// File: frontend/src/pages/LegalScorePage.jsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaExternalLinkAlt } from 'react-icons/fa';

// --- Configuration for Legal Score Tasks ---
const legalTasks = [
    {
        id: 'aadhaar',
        name: 'Aadhaar Card Linked & KYC Updated',
        description: 'Ensure your mobile number is linked and your KYC is up-to-date.',
        link: 'https://myaadhaar.uidai.gov.in/',
        points: 20, // Re-balanced
    },
    {
        id: 'pan',
        name: 'PAN Card Linked with Aadhaar',
        description: 'As per government regulations, your PAN must be linked with Aadhaar.',
        link: 'https://eportal.incometax.gov.in/iec/foservices/#/pre-login/bl-link-aadhaar',
        points: 20, // Re-balanced
    },
    {
        id: 'bankKyc',
        name: 'Bank Account e-KYC Completed',
        description: 'Verify that all your bank accounts are fully KYC compliant.',
        link: 'https://www.rbi.org.in/commonman/English/Scripts/PressReleases.aspx?Id=3310', // General RBI link
        points: 15,
    },
    {
        id: 'voter',
        name: 'Voter ID Card (EPIC) Issued',
        description: 'Verify you are registered to vote and have a valid EPIC card.',
        link: 'https://voters.eci.gov.in/',
        points: 15, // Re-balanced
    },
    {
        id: 'digilocker',
        name: 'DigiLocker Account Verified',
        description: 'A secure government-issued digital wallet for your documents.',
        link: 'https://www.digilocker.gov.in/',
        points: 10, // Re-balanced
    },
    {
        id: 'itr',
        name: 'Income Tax Return (ITR) Filed',
        description: 'Filed your ITR for the last assessment year (if applicable).',
        link: 'https://www.incometax.gov.in/iec/foportal/',
        points: 10,
    },
    {
        id: 'drivingLicense',
        name: 'Valid Driving License (Optional)',
        description: 'Check if your driving license is active and not expired.',
        link: 'https://parivahan.gov.in/parivahan//en/content/driving-licence-0',
        points: 5,
    },
    {
        id: 'passport',
        name: 'Valid Passport (Optional)',
        description: 'Having a valid passport is key for international travel and identity.',
        link: 'https://www.passportindia.gov.in/',
        points: 5, // Re-balanced
    }
];

// Calculate the maximum possible score
const totalMaxPoints = legalTasks.reduce((sum, task) => sum + task.points, 0);


// --- Main Page Component ---
function LegalScorePage() {
    // Create an initial state for checkboxes, all set to 'false'
    const [checkedState, setCheckedState] = useState(
        new Array(legalTasks.length).fill(false)
    );

    const [score, setScore] = useState(0);

    // Update the score whenever the 'checkedState' changes
    useEffect(() => {
        const newScore = checkedState.reduce(
            (currentScore, isChecked, index) => {
                if (isChecked) {
                    return currentScore + legalTasks[index].points;
                }
                return currentScore;
            },
            0
        );
        setScore(newScore);
    }, [checkedState]);

    // Handler for when a checkbox is clicked
    const handleCheckboxChange = (position) => {
        const updatedCheckedState = checkedState.map((item, index) =>
            index === position ? !item : item
        );
        setCheckedState(updatedCheckedState);
    };

    const scorePercentage = (score / totalMaxPoints) * 100;

    return (
        <div className="flex-grow flex flex-col items-center justify-start text-text p-6 pt-12">

            {/* --- Page Title --- */}
            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl md:text-5xl font-extrabold mb-4 text-gradient-primary pb-3"
            >
                Check Your Legal Score
            </motion.h1>
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-subtext text-center max-w-lg"
            >
                See how legally "up-to-date" you are. Verify your documents using the links, then check the box.
            </motion.p>

            {/* --- Score Display --- */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="w-full max-w-lg bg-surface border border-border rounded-xl p-6 my-8 shadow-soft"
            >
                <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-medium text-text">Your Legal Score:</span>
                    <span className="text-3xl font-bold text-active">{score} / {totalMaxPoints}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-secondary rounded-full h-3">
                    <motion.div
                        className="bg-active h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${scorePercentage}%` }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    />
                </div>
            </motion.div>

            {/* --- Checklist --- */}
            <motion.div
                className="w-full max-w-lg space-y-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                {legalTasks.map((task, index) => (
                    <div
                        key={task.id}
                        className="bg-surface border border-border rounded-xl p-5 flex items-center shadow-soft"
                    >
                        {/* Checkbox */}
                        <input
                            type="checkbox"
                            id={task.id}
                            name={task.name}
                            value={task.id}
                            checked={checkedState[index]}
                            onChange={() => handleCheckboxChange(index)}
                            className="h-6 w-6 rounded text-active bg-secondary border-border focus:ring-active"
                        />

                        {/* Task Info */}
                        <div className="ml-4 flex-grow">
                            <label htmlFor={task.id} className="text-lg font-semibold text-text cursor-pointer">
                                {task.name}
                            </label>
                            <p className="text-sm text-subtext">{task.description}</p>
                        </div>

                        {/* External Link */}
                        <a
                            href={task.link}
                            target="_blank" // Opens in a new tab
                            rel="noopener noreferrer"
                            title="Verify on official site"
                            className="ml-4 text-subtext hover:text-active transition-colors"
                        >
                            <FaExternalLinkAlt className="w-4 h-4" />
                        </a>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

export default LegalScorePage;