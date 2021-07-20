# Audit Walk Tool

Audit Walk Tool is a web utility for creating a graded walk-along audit. Audit action items can be added using the AuditStep structure below. Once live, users can create a new walk and mark items as pass or fail during their walk. At the end, the audit is graded by comparing the number of pass items to the total graded items in each section (N/A rated items and Unscored items are disregarded). Users can also enter a comment for each step in each department which will be visible at the end. 

# Requirements

 - MongoDB
 - Server with NodeJS

# Customization

## Audit Steps
Audit steps can be created in the MongoDB "auditsteps" collection which will be created on initialization of the app. Audit steps should contain the following properties:
 - `section` (string) - The section key for this audit step (see [Sections](#Sections))
 - `name` (string) - The label for the audit step. This will be shown to the user during their walk.
 - `rating` (string) - Currently serves no function. This can be used to determine severity of each audit step.
 - `departments` (array) - A list of departments to include this step in. During walks, steps are organized by department. Adding the string "all" to the departments array will include this step in all departments.

## Departments
Departments are the pages shown to the user during their audit walk. For example, if I had two departments "Admin" and "Front-End", there would be two pages to my audit (one for each department) before it can be graded.

The `data/departments.json` file should simply contain a JSON list of departments you want represented. For the above example of Admin and Front-End, the contents of `departments.json` would be `["admin", "front-end"]`. 

## Sections
Once an audit walk is graded, all audit items will be grouped into whatever section it is assigned. The format of a section in the `data/sections.json` file should be a JSON object with the key being the section number or letter or any other identifier, and the value being whatever label you want to assign to the section number/letter. For example, `{"a": "Safety", "b": "Management", "c": "Payroll"}` would create three sections to assign to your steps. 

