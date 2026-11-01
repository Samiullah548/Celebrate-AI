import React from " react\;
import { Link } from \react-router-dom\;

function LandingPage() {
 return (
 <div className=\flex flex-col items-center justify-center min-h-screen bg-background text-text\>
 <h1 className=\text-4xl font-bold text-primary mb-4\>Your Perfect Celebration Starts Here.</h1>
 <p className=\text-lg mb-6\>Plan unforgettable events with personalized AI ideas, smart budgets, organized timelines, and stress-free checklists.</p>
 <div className=\flex space-x-4\>
 <Link to=\/create\ className=\px-6 py-2 bg-primary text-white rounded hover:bg-indigo-600\>Plan My Event</Link>
 <a href=\#features\ className=\px-6 py-2 bg-cardBg text-text rounded hover:bg-cardBg-dark\>Explore Features</a>
 </div>
 </div>
 );
}

export default LandingPage;
