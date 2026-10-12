export interface TourStep {
 id:string;
 title:string;
 explanation:string;
 section?:string;
 target?:string;
 showMobileSidebar?:boolean;
}

export const TOUR_VERSION="v1";
export const tourPreferenceKey=(userId?:string|null)=>"finora-guide-"+TOUR_VERSION+"-"+(userId||"guest");

export const TOUR_STEPS:readonly TourStep[]=[
 {id:"welcome",title:"Welcome to Finora! 👋",explanation:"Think of Finora as a notebook for your money. I'll show you where to write down money coming in, money going out, and plans for later. Nothing will be changed in this tour."},
 {id:"workspaces",title:"Your money notebooks",explanation:"A workspace is like a separate notebook. You could use one for yourself and another for a small business. Switch between them here.",target:"workspace",showMobileSidebar:true},
 {id:"overview",title:"Your money at a glance",explanation:"This is your dashboard. Income is money you receive. Expenses are money you spend. If you see sample data, those numbers are pretend.",section:"Overview",target:"overview"},
 {id:"transactions",title:"Write down money in or out",explanation:"Bought lunch? Add an expense. Got paid? Add income. Enter the amount, choose an account and save. We won't add anything during this tour.",section:"Transactions",target:"transactions"},
 {id:"accounts",title:"Where your money lives",explanation:"You can track cash, a bank account and savings separately. A transfer moves money between your own accounts—it isn't new income.",section:"Accounts",target:"accounts"},
 {id:"planning",title:"Make a simple plan",explanation:"A budget is a spending limit, like 'up to 500 this month'. A savings goal lets you watch your progress toward something important.",section:"Planning",target:"planning"},
 {id:"investments",title:"Track investments",explanation:"If you have investments, you can write down how many you own and what they're worth. You enter prices yourself; they aren't live.",section:"Investments",target:"investments"},
 {id:"reports",title:"Your monthly money report",explanation:"Pick a month to see your income and expenses together. Export a PDF or CSV to keep a copy or share with your accountant.",section:"Reports",target:"reports"},
 {id:"zakat",title:"Understand the Zakat planner",explanation:"This tool can help estimate the minimum wealth level (nisab) and the time you have held it (hawl). Please check prices, dates and religious guidance.",section:"Zakat",target:"zakat"},
 {id:"storage",title:"Choose where data is saved",explanation:"Local means this browser. Cloud means your signed-in online account. Both saves to both places. Keep a backup of important information.",section:"Storage",target:"storage"},
 {id:"finish",title:"You're ready to explore! ✨",explanation:"Try adding one income or expense, or explore the demo. You can restart this guide using the Help button at any time."}
];

export const totalTourSteps=TOUR_STEPS.length;
export const clampStep=(index:number)=>Math.max(0,Math.min(TOUR_STEPS.length-1,index));
