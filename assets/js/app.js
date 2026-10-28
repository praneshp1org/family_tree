const DEFAULT_FAMILY_DATA = window.DEFAULT_FAMILY_DATA || [];

const BRANCH_COLORS = ['#0ea5e9', '#f97316', '#14b8a6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#e11d48', '#06b6d4', '#6366f1'];
const branchColorMap = new Map();

function getUnionKey(parentIds = []) {
    if (!Array.isArray(parentIds) || parentIds.length === 0) return '';
    return [...parentIds].sort().join('-');
}

function getBranchColorByParents(parentIds = []) {
    const unionKey = getUnionKey(parentIds);
    if (!unionKey) return '#1e293b';

    if (!branchColorMap.has(unionKey)) {
        const color = BRANCH_COLORS[branchColorMap.size % BRANCH_COLORS.length];
        branchColorMap.set(unionKey, color);
    }

    return branchColorMap.get(unionKey);
}

const translations = {
    en: {
        siteTitle: 'प्यारा श्रेष्ठ family tree',
        interactiveGenealogy: 'Interactive Genealogy',
        searchPlaceholder: 'Search family member...',
        jsonData: 'JSON Data',
        lineageHint: 'Hover over any person to highlight their lineage',
        legendParent: 'Parent & Sibling Lines',
        legendBranch: 'Branch Colors = Parent Couple',
        legendAncestors: 'Ancestors (Top)',
        legendHovered: 'Hovered Member',
        legendDescendants: 'Descendants (Bottom)',
        legendTip: '🖱 Drag background or scroll wheel to navigate',
        memberProfile: 'Member Profile',
        dataEditorTitle: 'Family JSON Data Editor',
        dataEditorHelp: 'Edit family relationships directly. Specify parent, spouse, and child IDs to customize the genealogy tree.',
        downloadJson: 'Download JSON',
        resetDefault: 'Reset Default',
        applyTree: 'Apply & Render Tree',
        invalidJson: 'Invalid JSON format!',
        generation: 'Generation',
        familyRoot: 'Family Root',
        childOf: 'Child of',
        noMembersFound: 'No members found',
        biography: 'Biography',
        noBiography: 'No biography details provided.',
        spouseLabel: 'Spouse(s)',
        parentsLabel: 'Parents',
        childrenLabel: 'Children',
        lifespan: 'Lifespan',
        present: 'Present',
        membersLabel: 'Members',
        branchOf: 'Branch of',
        exportPng: 'Export PNG',
        exporting: 'Exporting...',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        resetView: 'Reset View',
        languageToggle: 'EN / नेपाली'
    },
    ne: {
        siteTitle: 'प्यारा श्रेष्ठ family tree',
        interactiveGenealogy: 'अन्तर्क्रियात्मक वंशावली',
        searchPlaceholder: 'परिवार सदस्य खोज्नुहोस्...',
        jsonData: 'JSON डेटा',
        lineageHint: 'कुनै व्यक्तिको वंशलाई हाइलाइट गर्नमाथि होभर गर्नुहोस्',
        legendParent: 'अभिभावक र सहोदर लाइनहरू',
        legendBranch: 'शाखा रङ = अभिभावक जोडी',
        legendAncestors: 'वंशज (माथि)',
        legendHovered: 'हाइलाइट गरिएको सदस्य',
        legendDescendants: 'वंशधर (तल)',
        legendTip: '🖱 पृष्ठभूमि拖 गर्नुहोस् वा तेस्रोWheel ले नेभिगेट गर्नुहोस्',
        memberProfile: 'सदस्य प्रोफाइल',
        dataEditorTitle: 'परिवार JSON डेटा सम्पादक',
        dataEditorHelp: 'परिवारको सम्बन्धलाई प्रत्यक्ष रूपमा सम्पादित गर्नुहोस्। वंश वृक्षलाई अनुकूल बनाउन अभिभावक, जीवनसाथी र बच्चाको ID लेख्नुहोस्।',
        downloadJson: 'JSON डाउनलोड',
        resetDefault: 'पूर्वनिर्धारित फर्काउनुहोस्',
        applyTree: 'वृक्ष लागू गर्नुहोस्',
        invalidJson: 'अमान्य JSON ढाँचा!',
        generation: 'पौत्री',
        familyRoot: 'परिवार मूल',
        childOf: 'को बच्चा',
        noMembersFound: 'कुनै सदस्य भेटिएन',
        biography: 'जीवनी',
        noBiography: 'कुनै जीवनी विवरण उपलब्ध छैन।',
        spouseLabel: 'जीवनसाथी',
        parentsLabel: 'अभिभावक',
        childrenLabel: 'बच्चाहरू',
        lifespan: 'जीवनकाल',
        present: 'हालसम्म',
        membersLabel: 'सदस्यहरू',
        branchOf: 'शाखा',
        exportPng: 'PNG निर्यात',
        exporting: 'निर्यात हुँदै...',
        zoomIn: 'जूम इन',
        zoomOut: 'जूम आउट',
        resetView: 'दृश्य रिसेट',
        languageToggle: 'ने / EN'
    }
};

let familyData = [...DEFAULT_FAMILY_DATA];
let zoomScale = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let startX, startY;
let selectedMemberId = null;
let currentLanguage = localStorage.getItem('familyTreeLang') || 'ne';

const treeViewport = document.getElementById('treeViewport');
const treeCanvas = document.getElementById('treeCanvas');
const treeNodes = document.getElementById('treeNodes');
const svgConnectors = document.getElementById('svgConnectors');
const lineageBanner = document.getElementById('lineageBanner');
const lineageBannerText = document.getElementById('lineageBannerText');

function getTranslation(key) {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

function applyLanguage() {
    const lang = translations[currentLanguage] ? currentLanguage : 'en';
    document.documentElement.lang = lang === 'ne' ? 'ne' : 'en';

    const siteTitle = document.getElementById('siteTitle');
    if (siteTitle) siteTitle.textContent = getTranslation('siteTitle');
    document.title = getTranslation('siteTitle');

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = getTranslation('searchPlaceholder');

    const langToggle = document.getElementById('langToggle');
    if (langToggle) langToggle.textContent = getTranslation('languageToggle');

    const lineageBannerVal = document.getElementById('lineageBannerText');
    if (lineageBannerVal && lineageBannerVal.dataset.defaultText) {
        lineageBannerVal.textContent = lineageBannerVal.dataset.defaultText;
    }
    if (lineageBannerVal) {
        lineageBannerVal.dataset.defaultText = getTranslation('lineageHint');
        if (lineageBannerVal.innerText && !lineageBannerVal.innerHTML.includes('<b>')) {
            lineageBannerVal.textContent = getTranslation('lineageHint');
        }
    }

    const legendParentText = document.getElementById('legendParentText');
    if (legendParentText) legendParentText.textContent = getTranslation('legendParent');

    const legendBranchText = document.getElementById('legendBranchText');
    if (legendBranchText) legendBranchText.textContent = getTranslation('legendBranch');

    const legendAncestorsText = document.getElementById('legendAncestorsText');
    if (legendAncestorsText) legendAncestorsText.textContent = getTranslation('legendAncestors');

    const legendHoveredText = document.getElementById('legendHoveredText');
    if (legendHoveredText) legendHoveredText.textContent = getTranslation('legendHovered');

    const legendDescendantsText = document.getElementById('legendDescendantsText');
    if (legendDescendantsText) legendDescendantsText.textContent = getTranslation('legendDescendants');

    const legendTipText = document.getElementById('legendTipText');
    if (legendTipText) legendTipText.textContent = getTranslation('legendTip');

    const memberProfileTitle = document.getElementById('memberProfileTitle');
    if (memberProfileTitle) memberProfileTitle.textContent = getTranslation('memberProfile');

    const zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) zoomInBtn.title = getTranslation('zoomIn');

    const exportPngBtn = document.getElementById('exportPngBtn');
    if (exportPngBtn) exportPngBtn.title = getTranslation('exportPng');

    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) zoomOutBtn.title = getTranslation('zoomOut');

    const resetZoomBtn = document.getElementById('resetZoomBtn');
    if (resetZoomBtn) resetZoomBtn.title = getTranslation('resetView');

    updateMemberCount();
    if (selectedMemberId) {
        highlightFullHistory(selectedMemberId);
    } else {
        clearLineageHighlight();
    }
}

function updateMemberCount() {
    const totalMembersCount = document.getElementById('totalMembersCount');
    if (!totalMembersCount) return;
    totalMembersCount.textContent = `${familyData.length} ${getTranslation('membersLabel')}`;
}

window.onload = () => {
    applyLanguage();
    initTree();
    setupPanZoom();
    setupEventListeners();

    const resizeObserver = new ResizeObserver(() => {
        drawOrthogonalConnectors();
        centerTree();
    });
    resizeObserver.observe(treeNodes);

    window.addEventListener('resize', () => {
        requestAnimationFrame(() => centerTree());
    });

    setTimeout(() => centerTree(), 100);
};

function getSpouses(member) {
    if (!member.spouse) return [];
    const spouseIds = Array.isArray(member.spouse) ? member.spouse : [member.spouse];
    return spouseIds.map(id => familyData.find(m => m.id === id)).filter(Boolean);
}

function getFamilyGroupKey(member) {
    const parentKey = getUnionKey(member.parents || []);
    if (parentKey) return `parents-${parentKey}`;

    const spouseIds = getSpouses(member).map(spouse => spouse.id);
    for (const spouseId of spouseIds) {
        const spouse = familyData.find(m => m.id === spouseId);
        if (!spouse) continue;

        const spouseParentKey = getUnionKey(spouse.parents || []);
        if (spouseParentKey) return `parents-${spouseParentKey}`;
    }

    if (spouseIds.length > 0) {
        return `couple-${[member.id, ...spouseIds].sort().join('-')}`;
    }

    return `solo-${member.id}`;
}

function initTree() {
    treeNodes.innerHTML = '';
    branchColorMap.clear();
    updateMemberCount();

    const maxGen = Math.max(...familyData.map(m => m.generation || 1));

    for (let g = 1; g <= maxGen; g++) {
        const membersInGen = familyData.filter(m => (m.generation || 1) === g);
        if (membersInGen.length === 0) continue;

        const genRow = document.createElement('div');
        genRow.className = 'flex flex-col items-center relative w-full';
        genRow.dataset.generation = g;

        const genLabel = document.createElement('div');
        genLabel.className = 'text-[10px] font-extrabold tracking-widest text-amber-900 uppercase bg-amber-100/90 border border-amber-300 px-4 py-1 rounded-full mb-6 shadow-sm';
        genLabel.innerText = `Generation ${g}`;
        genRow.appendChild(genLabel);

        const genMembersContainer = document.createElement('div');
        genMembersContainer.className = 'flex flex-wrap justify-center items-start gap-6 sm:gap-10 px-12';

        const groupedMembers = new Map();
        const renderedMemberIds = new Set();

        membersInGen.forEach(member => {
            const groupKey = getFamilyGroupKey(member);
            if (!groupedMembers.has(groupKey)) {
                groupedMembers.set(groupKey, new Set());
            }

            groupedMembers.get(groupKey).add(member.id);
        });

        groupedMembers.forEach(memberIds => {
            const familyGroup = document.createElement('div');
            familyGroup.className = 'flex items-center justify-center gap-2 sm:gap-3 relative p-2 bg-white/80 rounded-3xl border border-slate-200/90 shadow-sm';

            const orderedIds = Array.from(memberIds).filter(id => !renderedMemberIds.has(id));
            if (orderedIds.length === 0) return;

            orderedIds.forEach(id => {
                const member = familyData.find(m => m.id === id);
                if (!member || renderedMemberIds.has(member.id)) return;

                const card = createMemberCard(member);
                familyGroup.appendChild(card);
                renderedMemberIds.add(member.id);

                const spouses = getSpouses(member).filter(spouse =>
                    (spouse.generation || 1) === g && !renderedMemberIds.has(spouse.id)
                );

                spouses.forEach(spouse => {
                    const marriageBadge = document.createElement('div');
                    marriageBadge.id = `union-${[member.id, spouse.id].sort().join('-')}`;
                    marriageBadge.className = 'w-7 h-7 rounded-full bg-amber-100 border-2 border-amber-500 text-amber-700 flex items-center justify-center text-xs font-bold shadow-md z-20 -mx-1 hover:scale-110 transition';
                    marriageBadge.title = `Marriage Union: ${member.name.split(' ')[0]} & ${spouse.name.split(' ')[0]}`;
                    marriageBadge.innerHTML = '<i class="fa-solid fa-heart text-[10px] text-red-600"></i>';

                    const spouseCard = createMemberCard(spouse);
                    familyGroup.appendChild(marriageBadge);
                    familyGroup.appendChild(spouseCard);
                    renderedMemberIds.add(spouse.id);
                });
            });

            genMembersContainer.appendChild(familyGroup);
        });

        genRow.appendChild(genMembersContainer);
        treeNodes.appendChild(genRow);
    }

    setTimeout(() => {
        drawOrthogonalConnectors();
    }, 60);

    document.querySelectorAll('.member-card img').forEach(img => {
        img.addEventListener('load', () => drawOrthogonalConnectors());
    });
}

function createMemberCard(member) {
    const card = document.createElement('div');
    card.id = `card-${member.id}`;
    card.dataset.id = member.id;

    const isMale = member.gender === 'male';
    const genderBg = isMale ? 'bg-blue-500' : 'bg-rose-500';
    const genderBorder = isMale ? 'border-blue-400' : 'border-rose-400';
    const lifespan = `${member.birthYear || '?'} - ${member.deathYear || getTranslation('present')}`;

    const parentMembers = familyData.filter(m => member.parents && member.parents.includes(m.id));
    const parentNames = parentMembers.map(p => p.name.split(' ')[0]).join(' & ');
    const branchColor = getBranchColorByParents(member.parents || []);

    card.className = `member-card cursor-pointer bg-white rounded-2xl p-3 shadow-md border-2 ${genderBorder} w-52 sm:w-56 flex flex-col gap-2 relative z-20 select-none`;

    card.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
                <img src="${member.photo}" alt="${member.name}" 
                    onerror="this.src='https://placehold.co/100x100/e2e8f0/475569?text=${encodeURIComponent(member.name[0])}'"
                    class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-slate-200 shadow-inner">
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${genderBg} border-2 border-white"></span>
            </div>
            <div class="min-w-0 flex-1">
                <h4 class="font-bold text-slate-900 text-xs truncate leading-snug">${member.name}</h4>
                <p class="text-[10px] font-semibold text-slate-400 mt-0.5">${lifespan}</p>
            </div>
        </div>
        ${parentNames ? `
            <div class="branch-chip bg-sky-50/70 rounded-lg px-2 py-1 text-[9.5px] font-bold text-slate-800 flex items-center justify-between border border-slate-200/80 truncate" style="border-left-color:${branchColor}">
                <span class="truncate"><span class="branch-chip-label">${getTranslation('branchOf')}:</span> ${parentNames}</span>
                <i class="fa-solid fa-arrow-up text-[9px] text-amber-600"></i>
            </div>
        ` : `
            <div class="bg-slate-50 rounded-lg px-2 py-1 text-[9.5px] font-bold text-slate-500 flex items-center justify-between border border-slate-200">
                <span>${getTranslation('familyRoot')}</span>
                <i class="fa-solid fa-crown text-[9px] text-amber-500"></i>
            </div>
        `}
    `;

    card.addEventListener('mouseenter', () => {
        highlightFullHistory(member.id);
    });

    card.addEventListener('mouseleave', () => {
        if (selectedMemberId) {
            highlightFullHistory(selectedMemberId);
        } else {
            clearLineageHighlight();
        }
    });

    card.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedMemberId = member.id;
        openDrawer(member.id);
        highlightFullHistory(member.id);
    });

    return card;
}

function getCanvasOffset(el) {
    const elRect = el.getBoundingClientRect();
    const canvasRect = treeCanvas.getBoundingClientRect();
    return {
        x: (elRect.left - canvasRect.left) / zoomScale,
        y: (elRect.top - canvasRect.top) / zoomScale,
        width: elRect.width / zoomScale,
        height: elRect.height / zoomScale
    };
}

function drawOrthogonalConnectors() {
    svgConnectors.innerHTML = '';

    const canvasWidth = Math.max(treeNodes.scrollWidth, treeNodes.offsetWidth, treeViewport.offsetWidth);
    const canvasHeight = Math.max(treeNodes.scrollHeight, treeNodes.offsetHeight, treeViewport.offsetHeight);

    treeCanvas.style.width = `${canvasWidth}px`;
    treeCanvas.style.height = `${canvasHeight}px`;

    svgConnectors.style.width = `${canvasWidth}px`;
    svgConnectors.style.height = `${canvasHeight}px`;
    svgConnectors.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);

    familyData.forEach(member => {
        const spouses = getSpouses(member);
        spouses.forEach(spouse => {
            const unionBadge = document.getElementById(`union-${[member.id, spouse.id].sort().join('-')}`);
            const mCard = document.getElementById(`card-${member.id}`);
            const sCard = document.getElementById(`card-${spouse.id}`);

            if (unionBadge && mCard && sCard) {
                const bOffset = getCanvasOffset(unionBadge);
                const mOffset = getCanvasOffset(mCard);
                const sOffset = getCanvasOffset(sCard);

                const mX = mOffset.x + mOffset.width;
                const mY = mOffset.y + mOffset.height / 2;
                const sX = sOffset.x;
                const sY = sOffset.y + sOffset.height / 2;

                createSvgPath(`M ${mX} ${mY} H ${bOffset.x}`, [member.id, spouse.id], null, true);
                createSvgPath(`M ${bOffset.x + bOffset.width} ${sY} H ${sX}`, [member.id, spouse.id], null, true);
            }
        });
    });

    const unions = {};

    familyData.forEach(member => {
        if (member.parents && member.parents.length > 0) {
            const unionKey = [...member.parents].sort().join('-');
            if (!unions[unionKey]) {
                unions[unionKey] = {
                    parents: member.parents,
                    children: []
                };
            }
            unions[unionKey].children.push(member.id);
        }
    });

    Object.keys(unions).forEach(unionKey => {
        const { parents, children } = unions[unionKey];
        if (children.length === 0) return;

        let parentX, parentY;

        if (parents.length === 2) {
            const badge = document.getElementById(`union-${[parents[0], parents[1]].sort().join('-')}`);
            if (badge) {
                const bOffset = getCanvasOffset(badge);
                parentX = bOffset.x + bOffset.width / 2;
                parentY = bOffset.y + bOffset.height;
            } else {
                const p1Card = document.getElementById(`card-${parents[0]}`);
                const p2Card = document.getElementById(`card-${parents[1]}`);
                if (p1Card && p2Card) {
                    const p1Offset = getCanvasOffset(p1Card);
                    const p2Offset = getCanvasOffset(p2Card);
                    parentX = (p1Offset.x + p1Offset.width / 2 + p2Offset.x + p2Offset.width / 2) / 2;
                    parentY = Math.max(p1Offset.y + p1Offset.height, p2Offset.y + p2Offset.height);
                } else if (p1Card) {
                    const p1Offset = getCanvasOffset(p1Card);
                    parentX = p1Offset.x + p1Offset.width / 2;
                    parentY = p1Offset.y + p1Offset.height;
                } else {
                    return;
                }
            }
        } else if (parents.length === 1) {
            const pCard = document.getElementById(`card-${parents[0]}`);
            if (!pCard) return;
            const pOffset = getCanvasOffset(pCard);
            parentX = pOffset.x + pOffset.width / 2;
            parentY = pOffset.y + pOffset.height;
        } else {
            return;
        }

        const childCoords = [];
        children.forEach(childId => {
            const childCard = document.getElementById(`card-${childId}`);
            if (childCard) {
                const cOffset = getCanvasOffset(childCard);
                const cX = cOffset.x + cOffset.width / 2;
                const cY = cOffset.y;
                childCoords.push({ id: childId, x: cX, y: cY });
            }
        });

        if (childCoords.length === 0) return;

        const minY = Math.min(...childCoords.map(c => c.y));
        const midY = parentY + (minY - parentY) * 0.45;
        const branchColor = getBranchColorByParents(parents);

        createSvgPath(`M ${parentX} ${parentY} V ${midY}`, parents, null, false, branchColor);
        createJunctionDot(parentX, midY, parents, null, branchColor);

        const allX = [parentX, ...childCoords.map(c => c.x)];
        const minSpanX = Math.min(...allX);
        const maxSpanX = Math.max(...allX);

        createSvgPath(`M ${minSpanX} ${midY} H ${maxSpanX}`, parents, null, false, branchColor);

        childCoords.forEach(c => {
            createSvgPath(`M ${c.x} ${midY} V ${c.y}`, parents, c.id, false, branchColor);
            createJunctionDot(c.x, c.y, parents, c.id, branchColor);
        });
    });
}

function createSvgPath(d, parents, childId, isSpouse = false, strokeColor = '#1e293b') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', isSpouse ? '#d97706' : strokeColor);
    path.setAttribute('stroke-width', isSpouse ? '2' : '3');
    if (isSpouse) path.setAttribute('stroke-dasharray', '4');
    path.setAttribute('class', 'connector-line');
    if (parents) path.dataset.parents = parents.join(',');
    if (childId) path.dataset.child = childId;

    svgConnectors.appendChild(path);
}

function createJunctionDot(cx, cy, parents, childId, fillColor = '#1e293b') {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('class', 'junction-dot');
    if (parents) circle.dataset.parents = parents.join(',');
    if (childId) circle.dataset.child = childId;

    svgConnectors.appendChild(circle);
}

function getAllAncestors(memberId, ancestors = new Set()) {
    const member = familyData.find(m => m.id === memberId);
    if (!member || !member.parents) return ancestors;
    member.parents.forEach(pId => {
        if (!ancestors.has(pId)) {
            ancestors.add(pId);
            getAllAncestors(pId, ancestors);
        }
    });
    return ancestors;
}

function getAllDescendants(memberId, descendants = new Set()) {
    const member = familyData.find(m => m.id === memberId);
    if (!member || !member.children) return descendants;
    member.children.forEach(cId => {
        if (!descendants.has(cId)) {
            descendants.add(cId);
            getAllDescendants(cId, descendants);
        }
    });
    return descendants;
}

function highlightFullHistory(memberId) {
    clearLineageHighlight();

    const member = familyData.find(m => m.id === memberId);
    if (!member) return;

    const ancestors = getAllAncestors(memberId);
    const descendants = getAllDescendants(memberId);

    lineageBannerText.innerHTML = `${currentLanguage === 'ne' ? 'ट्रेसिङ' : 'Tracing'} <b>${member.name}</b> • <span class="text-amber-600">${ancestors.size} ${currentLanguage === 'ne' ? 'वंशज' : 'Ancestor(s)'} ↑</span> • <span class="text-red-600">${descendants.size} ${currentLanguage === 'ne' ? 'वंशधर' : 'Descendant(s)'} ↓</span>`;
    lineageBanner.classList.remove('hidden');

    const directLineageIds = new Set([memberId, ...ancestors, ...descendants]);

    const relevantSpouses = new Set();
    directLineageIds.forEach(id => {
        const m = familyData.find(x => x.id === id);
        if (m && m.spouse) {
            if (Array.isArray(m.spouse)) m.spouse.forEach(s => relevantSpouses.add(s));
            else relevantSpouses.add(m.spouse);
        }
    });

    document.querySelectorAll('.member-card').forEach(card => {
        const id = card.dataset.id;
        if (id === memberId) {
            card.classList.add('card-focused');
        } else if (ancestors.has(id)) {
            card.classList.add('card-ancestor');
        } else if (descendants.has(id)) {
            card.classList.add('card-descendant');
        } else if (relevantSpouses.has(id)) {
        } else {
            card.classList.add('dimmed');
        }
    });

    document.querySelectorAll('.connector-line').forEach(line => {
        const parentsStr = line.dataset.parents || '';
        const childId = line.dataset.child || '';
        const parentIds = parentsStr.split(',');

        const isParentInLineage = parentIds.some(p => directLineageIds.has(p));
        const isChildInLineage = childId ? directLineageIds.has(childId) : false;

        if (isChildInLineage && (ancestors.has(childId) || childId === memberId)) {
            line.classList.add('highlight-ancestor-line');
        } else if (isParentInLineage && (descendants.has(childId) || parentIds.includes(memberId))) {
            line.classList.add('highlight-descendant-line');
        } else if (!childId && parentIds.some(p => directLineageIds.has(p))) {
            line.classList.add('highlight-ancestor-line');
        } else {
            line.classList.add('dimmed');
        }
    });

    document.querySelectorAll('.junction-dot').forEach(dot => {
        const parentsStr = dot.dataset.parents || '';
        const childId = dot.dataset.child || '';
        const parentIds = parentsStr.split(',');

        if (childId && (ancestors.has(childId) || childId === memberId)) {
            dot.classList.add('highlight-dot-ancestor');
        } else if (parentIds.some(p => directLineageIds.has(p))) {
            dot.classList.add('highlight-dot-descendant');
        } else {
            dot.classList.add('dimmed');
        }
    });
}

function clearLineageHighlight() {
    lineageBanner.classList.add('hidden');
    document.querySelectorAll('.member-card').forEach(c => {
        c.classList.remove('dimmed', 'card-focused', 'card-ancestor', 'card-descendant');
    });
    document.querySelectorAll('.connector-line').forEach(l => {
        l.classList.remove('dimmed', 'highlight-ancestor-line', 'highlight-descendant-line');
    });
    document.querySelectorAll('.junction-dot').forEach(d => {
        d.classList.remove('dimmed', 'highlight-dot-ancestor', 'highlight-dot-descendant');
    });
}

function setupPanZoom() {
    const updateTransform = () => {
        treeCanvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    };

    treeViewport.addEventListener('mousedown', (e) => {
        if (e.target.closest('.member-card') || e.target.closest('button')) return;
        isDragging = true;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panX = e.clientX - startX;
        panY = e.clientY - startY;
        updateTransform();
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    treeViewport.addEventListener('wheel', (e) => {
        e.preventDefault();

        if (e.ctrlKey || e.metaKey) {
            const zoomDelta = -e.deltaY * 0.002;
            zoomScale = Math.min(Math.max(0.3, zoomScale + zoomDelta), 2.5);
        } else {
            panX -= e.deltaX;
            panY -= e.deltaY;
        }
        updateTransform();
    }, { passive: false });

    let lastTouchX = 0;
    let lastTouchY = 0;

    treeViewport.addEventListener('touchstart', (e) => {
        if (e.target.closest('.member-card')) return;
        if (e.touches.length === 1) {
            isDragging = true;
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
        }
    }, { passive: true });

    treeViewport.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging) {
            const deltaX = e.touches[0].clientX - lastTouchX;
            const deltaY = e.touches[0].clientY - lastTouchY;
            lastTouchX = e.touches[0].clientX;
            lastTouchY = e.touches[0].clientY;
            panX += deltaX;
            panY += deltaY;
            updateTransform();
        }
    }, { passive: true });

    treeViewport.addEventListener('touchend', () => {
        isDragging = false;
    });

    document.getElementById('zoomInBtn').addEventListener('click', () => {
        zoomScale = Math.min(zoomScale + 0.15, 2.5);
        updateTransform();
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        zoomScale = Math.max(zoomScale - 0.15, 0.3);
        updateTransform();
    });

    document.getElementById('resetZoomBtn').addEventListener('click', () => {
        centerTree();
    });

    document.getElementById('exportPngBtn')?.addEventListener('click', () => {
        exportTreeAsPng();
    });
}

function centerTree() {
    const canvasWidth = treeCanvas.scrollWidth || treeNodes.scrollWidth || treeViewport.clientWidth;
    const canvasHeight = treeCanvas.scrollHeight || treeNodes.scrollHeight || treeViewport.clientHeight;

    zoomScale = 1;
    panX = (treeViewport.clientWidth - canvasWidth) / 2;
    panY = Math.max(60, Math.min(120, treeViewport.clientHeight * 0.08));

    treeCanvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    drawOrthogonalConnectors();
}

async function exportTreeAsPng() {
    const exportBtn = document.getElementById('exportPngBtn');
    const drawer = document.getElementById('memberDrawer');

    if (!exportBtn || typeof window.html2canvas !== 'function') {
        alert('PNG export is not available right now.');
        return;
    }

    const previousTitle = exportBtn.title;
    const previousDisabled = exportBtn.disabled;
    const wasDrawerOpen = drawer && !drawer.classList.contains('translate-x-full');
    let exportSurface = null;

    try {
        exportBtn.disabled = true;
        exportBtn.title = getTranslation('exporting');
        exportBtn.classList.add('opacity-60', 'cursor-not-allowed');

        if (wasDrawerOpen) {
            drawer.classList.add('translate-x-full');
        }

        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        const currentTransform = window.getComputedStyle(treeCanvas).transform;
        const cloneViewport = treeViewport.cloneNode(true);
        cloneViewport.style.position = 'fixed';
        cloneViewport.style.left = '0';
        cloneViewport.style.top = '0';
        cloneViewport.style.width = `${treeViewport.clientWidth}px`;
        cloneViewport.style.height = `${treeViewport.clientHeight}px`;
        cloneViewport.style.overflow = 'hidden';
        cloneViewport.style.pointerEvents = 'none';
        cloneViewport.style.background = '#FAF7F2';
        cloneViewport.style.opacity = '1';
        cloneViewport.style.transform = 'none';

        const canvasClone = cloneViewport.querySelector('#treeCanvas');
        if (canvasClone) {
            canvasClone.classList.remove('transform-gpu');
            canvasClone.style.position = 'relative';
            canvasClone.style.left = '0';
            canvasClone.style.top = '0';
            canvasClone.style.transform = currentTransform;
            canvasClone.style.width = `${treeCanvas.scrollWidth}px`;
            canvasClone.style.height = `${treeCanvas.scrollHeight}px`;
            canvasClone.style.minWidth = `${treeCanvas.scrollWidth}px`;
            canvasClone.style.minHeight = `${treeCanvas.scrollHeight}px`;
        }

        cloneViewport.querySelectorAll('.member-card').forEach(card => {
            card.style.overflow = 'visible';
            card.style.paddingBottom = '14px';
        });

        cloneViewport.querySelectorAll('.member-card h4').forEach(el => {
            el.style.lineHeight = '1.3';
            el.style.paddingBottom = '2px';
        });

        cloneViewport.querySelectorAll('.member-card p').forEach(el => {
            el.style.lineHeight = '1.35';
            el.style.paddingBottom = '2px';
        });

        cloneViewport.querySelectorAll('.member-card .branch-chip').forEach(el => {
            el.style.minHeight = '26px';
            el.style.alignItems = 'center';
        });

        exportSurface = document.createElement('div');
        exportSurface.style.position = 'fixed';
        exportSurface.style.left = '0';
        exportSurface.style.top = '0';
        exportSurface.style.transform = 'none';
        exportSurface.style.opacity = '1';
        exportSurface.style.pointerEvents = 'none';
        exportSurface.style.padding = '0';
        exportSurface.style.background = '#FAF7F2';
        exportSurface.style.display = 'inline-block';
        exportSurface.style.zIndex = '1';
        exportSurface.appendChild(cloneViewport);
        document.body.appendChild(exportSurface);

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const canvas = await window.html2canvas(exportSurface, {
            backgroundColor: '#FAF7F2',
            scale: Math.min(2, window.devicePixelRatio || 1),
            useCORS: true,
            allowTaint: false,
            logging: false,
            width: treeViewport.clientWidth,
            height: treeViewport.clientHeight
        });

        const now = new Date();
        const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const link = document.createElement('a');
        link.download = `family-tree-${stamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (err) {
        console.error('Failed to export PNG', err);
        alert('Failed to export PNG. Please try again.');
    } finally {
        if (exportSurface && exportSurface.parentNode) {
            exportSurface.parentNode.removeChild(exportSurface);
        }

        if (wasDrawerOpen) {
            drawer.classList.remove('translate-x-full');
        }

        exportBtn.disabled = previousDisabled;
        exportBtn.title = previousTitle;
        exportBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    }
}

function openDrawer(memberId) {
    const member = familyData.find(m => m.id === memberId);
    if (!member) return;

    const drawer = document.getElementById('memberDrawer');
    const drawerContent = document.getElementById('drawerContent');

    const spouseObjs = getSpouses(member);
    const parentObjs = familyData.filter(m => member.parents && member.parents.includes(m.id));
    const childObjs = familyData.filter(m => member.children && member.children.includes(m.id));

    drawerContent.innerHTML = `
        <div class="flex flex-col items-center text-center">
            <img src="${member.photo}" alt="${member.name}" 
                onerror="this.src='https://placehold.co/150x150/e2e8f0/475569?text=${encodeURIComponent(member.name[0])}'"
                class="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl mb-3">
            <h2 class="text-xl font-bold text-slate-900">${member.name}</h2>
            <span class="text-xs font-semibold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300 mt-1">
                ${getTranslation('generation')} ${member.generation || 1}
            </span>
            <p class="text-xs text-slate-500 mt-2 font-medium">${getTranslation('lifespan')}: ${member.birthYear || '?'} - ${member.deathYear || getTranslation('present')}</p>
        </div>

        <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">${getTranslation('biography')}</h3>
            <p class="text-xs text-slate-700 leading-relaxed">${member.bio || getTranslation('noBiography')}</p>
        </div>

        ${spouseObjs.length > 0 ? `
            <div class="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-2">
                <h3 class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">${getTranslation('spouseLabel')} (${spouseObjs.length})</h3>
                ${spouseObjs.map(s => `
                    <div class="flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-amber-100/50 transition bg-white/60 border border-amber-200/50" onclick="jumpToMember('${s.id}')">
                        <img src="${s.photo}" class="w-9 h-9 rounded-xl object-cover">
                        <div>
                            <h4 class="text-xs font-bold text-slate-900">${s.name}</h4>
                            <p class="text-[10px] text-slate-500">${s.birthYear || '?'} - ${s.deathYear || getTranslation('present')}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${parentObjs.length > 0 ? `
            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">${getTranslation('parentsLabel')}</h3>
                <div class="grid grid-cols-1 gap-2">
                    ${parentObjs.map(p => `
                        <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition" onclick="jumpToMember('${p.id}')">
                            <img src="${p.photo}" class="w-8 h-8 rounded-lg object-cover">
                            <span class="text-xs font-semibold text-slate-800">${p.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${childObjs.length > 0 ? `
            <div class="space-y-2">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">${getTranslation('childrenLabel')} (${childObjs.length})</h3>
                <div class="grid grid-cols-1 gap-2">
                    ${childObjs.map(c => `
                        <div class="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition" onclick="jumpToMember('${c.id}')">
                            <img src="${c.photo}" class="w-8 h-8 rounded-lg object-cover">
                            <span class="text-xs font-semibold text-slate-800">${c.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    drawer.classList.remove('translate-x-full');
}

function closeDrawer() {
    selectedMemberId = null;
    document.getElementById('memberDrawer').classList.add('translate-x-full');
    clearLineageHighlight();
}

function jumpToMember(id) {
    selectedMemberId = id;
    openDrawer(id);
    highlightFullHistory(id);
    const card = document.getElementById(`card-${id}`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

function setupEventListeners() {
    document.getElementById('closeDrawerBtn').addEventListener('click', closeDrawer);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('#memberDrawer') && !e.target.closest('.member-card') && !e.target.closest('#dataModal')) {
            closeDrawer();
        }
    });

    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const clearSearch = document.getElementById('clearSearch');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            searchResults.classList.add('hidden');
            clearSearch.classList.add('hidden');
            clearLineageHighlight();
            return;
        }

        clearSearch.classList.remove('hidden');
        const matches = familyData.filter(m => m.name.toLowerCase().includes(query));

        if (matches.length === 0) {
            searchResults.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">${getTranslation('noMembersFound')}</div>`;
        } else {
            searchResults.innerHTML = matches.map(m => `
                <div class="px-4 py-2 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs" onclick="jumpToMember('${m.id}')">
                    <span class="font-bold text-slate-800">${m.name}</span>
                    <span class="text-[10px] text-amber-700 font-semibold">${getTranslation('generation')} ${m.generation || 1}</span>
                </div>
            `).join('');
        }
        searchResults.classList.remove('hidden');
    });

    clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        searchResults.classList.add('hidden');
        clearSearch.classList.add('hidden');
        clearLineageHighlight();
    });

    const langToggle = document.getElementById('langToggle');

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLanguage = currentLanguage === 'en' ? 'ne' : 'en';
            localStorage.setItem('familyTreeLang', currentLanguage);
            applyLanguage();
        });
    }

    window.addEventListener('resize', () => {
        drawOrthogonalConnectors();
    });
}
