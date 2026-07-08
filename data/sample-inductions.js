/* ============================================================
   SAMPLE induction data — for demo only.
   In production the admin dashboard reads from DATA_URL (a Power
   Automate "Get items" HTTP endpoint returning the SharePoint list
   as JSON). When DATA_URL is blank, admin.html falls back to this.
   ============================================================ */
(function(){
  const Y="Yes", N="No";
  const INS="Public Liability / Insurances", WC="WorkCover",
        SW="SWMS", HR="High-Risk Work Licence", DR="Driver's Licence";

  // mk(date, time, name, company, siteKey, site, by, quizPass, docs[], hazardsWhat)
  function mk(date, time, name, company, siteKey, site, by, pass, docs, haz){
    const slug = name.toLowerCase().replace(/[^a-z]+/g,".");
    const comp = company.toLowerCase().replace(/[^a-z]+/g,"");
    return {
      id: date.replace(/-/g,"")+"-"+slug,
      meta:{ submittedAt: date+"T"+time+":00+10:00" },
      section1:{
        date, fullName:name, company,
        phone:"04"+(10000000+Math.floor((slug.length*9301+date.length*49297)%89999999)),
        email: slug+"@"+comp+".com.au",
        site, siteKey
      },
      section2:{
        walkAround:Y, quiz: pass?Y:N, assembly:Y, parking:Y, smoking:Y,
        bathrooms:Y, kitchen:Y, firstAid:Y, ppe:Y,
        incident:"Report immediately to HSSEQ or the Facilities Manager",
        quals:Y, mobile:Y, drugAlcohol:Y,
        hazards: haz?Y:N, hazardsWhat: haz||"",
        jsea:Y, jseaWhich:"Site JSEA / SWMS – "+site, tmp:Y,
        comments: pass?"":"Did not pass induction quiz — re-induction required before site access.",
        completedBy:by
      },
      documents: docs.map(d=>({docType:d})),
      quizPassed: pass
    };
  }

  window.SAMPLE_INDUCTIONS = [
    mk("2026-07-01","09:14","John Mercer","Mercer Electrical Pty Ltd","portbrisbane","Port of Brisbane, Brisbane","Kim Donaldson",true,[INS,WC,SW,HR,DR],"Forklift movement near loading dock"),
    mk("2026-07-01","11:02","Aisha Rahman","Rapid Plumbing Solutions","hamilton","Hamilton, Brisbane","Thomas Nixon",true,[INS,WC,DR],null),
    mk("2026-06-30","08:40","Dave Kostas","Kostas Forklift Servicing","thomastown","Thomastown, Melbourne","Darren Cumming",true,[INS,WC,SW,HR],null),
    mk("2026-06-30","13:25","Liam O'Brien","Allstate Pest Control","campbellfield","Campbellfield, Melbourne","Matthew Vasyli",false,[INS,DR],null),
    mk("2026-06-29","10:15","Sophie Tran","Tran HVAC Services","essendon","Essendon Fields, Melbourne","Darren Cumming",true,[],null),
    mk("2026-06-28","09:50","Marco Bianchi","Bianchi Refrigeration","jandakot","Jandakot, Perth","Sam Ash",true,[INS,WC,SW,DR],null),
    mk("2026-06-27","14:05","Grace Liu","Sparkline Electrical","sydney","Sydney","Jared Lee",true,[INS,WC,SW,HR,DR],"Working at heights near racking"),
    mk("2026-06-26","08:20","Peter Walsh","Walsh Crane Hire","portbrisbane","Port of Brisbane, Brisbane","Kim Donaldson",true,[INS,WC,SW,HR],"Mobile crane lift over pedestrian walkway"),
    mk("2026-06-25","11:35","Hannah Schmidt","Cleanaway Services","hamilton","Hamilton, Brisbane","Thomas Nixon",true,[INS,WC,DR],null),
    mk("2026-06-24","15:10","Tomas Reyes","Reyes Line Marking","thomastown","Thomastown, Melbourne","Darren Cumming",false,[],null),
    mk("2026-06-23","09:05","Olivia Brooks","Brooks Fire Protection","lae","Lae, PNG","Joseph Kaupa",true,[INS,SW,DR],null),
    mk("2026-06-22","10:45","Nathan Cole","Cole Scaffold Systems","essendon","Essendon Fields, Melbourne","Matthew Vasyli",true,[INS,WC,SW,HR,DR],"Scaffold erection in pedestrian zone"),
    mk("2026-06-20","13:50","Priya Nair","Nair IT & Data Cabling","sydney","Sydney","Jared Lee",true,[INS,DR],null),
    mk("2026-06-19","08:55","Ben Foster","Foster Roofing","jandakot","Jandakot, Perth","Sam Ash",true,[INS,WC,SW,HR,DR],null),
    mk("2026-06-18","12:20","Emma Wilson","Wilson Glass & Glazing","campbellfield","Campbellfield, Melbourne","Darren Cumming",true,[INS,WC],null),
    mk("2026-06-16","09:30","Carlos Mendez","Mendez Concrete Cutting","portbrisbane","Port of Brisbane, Brisbane","Kim Donaldson",true,[INS,WC,SW,HR,DR],"Concrete cutting dust in high-traffic area")
  ];
})();
