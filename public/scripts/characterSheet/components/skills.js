import { formatBonus } from '../utils.js';

export function renderSkills(charData) {
    const container = document.getElementById('skills-column');
    container.innerHTML = '';
    
    // Skills Section
    const skillsSection = document.createElement('div');
    skillsSection.className = 'skills-section';
    skillsSection.innerHTML = '<div class="section-title">SKILLS</div>';
    
    const skillsTable = document.createElement('table');
    skillsTable.className = 'skills-table';
    skillsTable.innerHTML = `
        <thead>
            <tr>
                <th>PROF.</th>
                <th>SKILL</th>
                <th>ABILITY</th>
                <th>BONUS</th>
            </tr>
        </thead>
        <tbody id="skills-tbody"></tbody>
    `;
    
    const skillsTbody = skillsTable.querySelector('#skills-tbody');
    
    if (charData.skills && charData.skills.length > 0) {
        charData.skills.forEach(skill => {
            const row = document.createElement('tr');
            const profDot = skill.proficient ? 'gray-dot' : 'brown-dot';
            const abilityAbbr = skill.ability ? skill.ability.substring(0, 3).toUpperCase() : 'N/A';
            
            row.innerHTML = `
                <td><span class="prof-dot ${profDot}"></span></td>
                <td class="skill-name">${skill.name}</td>
                <td class="ability-abbr">${abilityAbbr}</td>
                <td><button class="bonus-button" onclick="rollSkill('${skill.name}', ${skill.bonus})">${formatBonus(skill.bonus)}</button></td>
            `;
            
            skillsTbody.appendChild(row);
        });
    } else {
        skillsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);">No skills selected</td></tr>';
    }
    
    skillsSection.appendChild(skillsTable);
    container.appendChild(skillsSection);
    
    // Sub-Skills Section
    if (charData.subSkills && charData.subSkills.length > 0) {
        const subSkillsSection = document.createElement('div');
        subSkillsSection.className = 'subskills-section';
        subSkillsSection.innerHTML = '<div class="section-title">SUB-SKILLS</div>';
        
        const subSkillsTable = document.createElement('table');
        subSkillsTable.className = 'subskills-table';
        subSkillsTable.innerHTML = `
            <thead>
                <tr>
                    <th>PROF.</th>
                    <th>BASE</th>
                    <th>SKILL</th>
                    <th>ABILITY</th>
                    <th>BONUS</th>
                </tr>
            </thead>
            <tbody id="subskills-tbody"></tbody>
        `;
        
        const subSkillsTbody = subSkillsTable.querySelector('#subskills-tbody');
        
        charData.subSkills.forEach(subSkill => {
            const row = document.createElement('tr');
            const profDot = subSkill.proficient ? 'gray-dot' : 'brown-dot';
            const abilityAbbr = subSkill.ability ? subSkill.ability.substring(0, 3).toUpperCase() : 'N/A';
            const baseAbbr = subSkill.baseSkill ? subSkill.baseSkill.substring(0, 4) : 'N/A';
            
            row.innerHTML = `
                <td><span class="prof-dot ${profDot}"></span></td>
                <td>${baseAbbr}</td>
                <td class="skill-name">${subSkill.name}</td>
                <td class="ability-abbr">${abilityAbbr}</td>
                <td><button class="bonus-button" onclick="rollSkill('${subSkill.name}', ${subSkill.bonus})">${formatBonus(subSkill.bonus)}</button></td>
            `;
            
            subSkillsTbody.appendChild(row);
        });
        
        subSkillsSection.appendChild(subSkillsTable);
        container.appendChild(subSkillsSection);
    }
}
