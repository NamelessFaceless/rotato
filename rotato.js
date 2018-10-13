'use strict';

// let Options = {};

let playerID = null;
let playerIDString = null;
let rotation = null;
let rotationIndex = -1;
let dwadcounter = 0;
let duality = 0;
let animation = {scrollY: 0};

let gTimelineController;

document.addEventListener('onPlayerChangedEvent', e => {
  const id = e.detail.id;
  if (id === playerID) return;

  playerID = id;
  playerIDString = id.toString(16).toUpperCase();
});

document.addEventListener('onLogEvent', e => {
  if (playerIDString == null) return;
  if (rotation == null) return;

  let nextSkill = rotation[rotationIndex];
  if (nextSkill == null) return;

  for (const log of e.detail.logs) {
    const line = log.slice(log.indexOf(']') + 1).trim().split(':');

    if (line[0] !== '15' && line[0] !== '16') continue;
    if (line[1] !== playerIDString) continue;

    console.log(line);
    const skillName = line[4];
    //console.log(skillName);
    if (skillName === 'Attack') continue;
    if (skillName === 'Ten') continue;
    if (skillName === 'Chi') continue;
    if (skillName === 'Jin') continue;
    if (skillName === 'Hide') continue;
    if (skillName === 'Huton') continue;
    if (skillName === 'Dream Within A Dream' && dwadcounter < 2) {
      dwadcounter++;
      continue;
    } else if (dwadcounter === 2) dwadcounter=0;
    if (skillName === 'Duality') duality = 1;
    else if (duality === 1) {
      duality = 0;
      continue;
    }

    const root = document.getElementsByClassName('rotation')[0];

    while (skillName.toLowerCase() !== nextSkill.name.toLowerCase()) { // TODO no toLowerCase?
      const item = root.children.item(rotationIndex);
      item.className += ' missed';
      rotationIndex++;
      nextSkill = rotation[rotationIndex];
      if (nextSkill == null) {
        // TODO explode
        break;
      }
    }

    if (nextSkill != null) {
      const item = root.children.item(rotationIndex);
      item.className += ' done';
      rotationIndex++;

      dynamics.stop(animation);

      const y = item.getBoundingClientRect().bottom;
      const endY = window.scrollY + y - window.innerHeight / 4;
      animation = {scrollY: window.scrollY};
      dynamics.animate(animation, {scrollY: endY}, {
        type: dynamics.easeOut,
        duration: 300,
        friction: 50,
        change: () => {
          window.scrollTo(0, animation.scrollY);
        },
      });
    }
  }
});

/*
document.addEventListener('onDataFilesRead', function(e) {
  gTimelineController.SetDataFiles(e.detail.files);
});

UserConfig.getUserConfigLocation('rotato', function(e) {
  gTimelineController = new TimelineController(Options, new TimelineUI(Options));
  gPopupText = new PopupText(Options);
  // Connect the timelines to the popup text.
  gTimelineController.SetPopupTextInterface(new PopupTextGenerator(gPopupText));
  gPopupText.SetTimelineLoader(new TimelineLoader(gTimelineController));
});
*/

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementsByClassName('btn-new')[0];
  button.addEventListener('click', () => {
    const url = new URL(prompt('Enter FFXIV Rotations URL:'));
    if (url.hostname !== 'ffxivrotations.com' && url.hostname !== 'www.ffxivrotations.com') return;

    const idMatch = url.pathname.match(/^\/([0-9a-z]+)/);
    if (!idMatch) return;

    const id = parseInt(idMatch[1], 36);
    const apiURL = `http://ffxivrotations.com/load.py?id=${id}`;
    fetch('https://cors-anywhere.herokuapp.com/' + apiURL).then(res => res.json()).then(res => {
      rotation = res.sequence.split(',').map(skillID => SKILLS[skillID]);
      rotationIndex = 0;

      for (const skill of rotation) {
        if (skill == null) throw new Error('oof');

        const root = document.createElement('div');
        root.className = 'skill';
        if (!skill.gcd) root.className += ' ogcd';

        const img = document.createElement('img');
        img.className = 'icon';
        img.src = `http://www.ffxivrotations.com/icons/${skill.icon}.png`;
        root.appendChild(img);

        const name = document.createElement('span');
        name.className = 'name';
        name.innerText = "   " + skill.name;
        root.appendChild(name);

        document.getElementsByClassName('rotation')[0].appendChild(root);
      }
    });
  });
});
