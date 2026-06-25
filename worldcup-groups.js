const WORLD_CUP_API_BASE_URL = 'https://worldcup26.ir';
const WORLD_CUP_GROUPS_API_URL = `${WORLD_CUP_API_BASE_URL}/get/groups`;
const WORLD_CUP_TEAMS_API_URL = `${WORLD_CUP_API_BASE_URL}/get/teams`;

async function requestWorldCupJson(url, token){
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });

  if(res.status === 401){
    throw new Error('Token 无效或已过期（401），请重新登录获取 token');
  }
  if(!res.ok){
    throw new Error(`请求失败：HTTP ${res.status}`);
  }

  return res.json();
}

function normalizeWorldCupList(data, key){
  if(Array.isArray(data)) return data;
  return data[key] || data.data || [];
}

function getGroupCode(group){
  return typeof group === 'string'
    ? group
    : (group.group || group.name || group.code || group.id || '');
}

function mergeTeamsWithStats(statsTeams, detailTeams){
  const detailMap = new Map(detailTeams.map(team => [String(team.id || '').toLowerCase(), team]));

  return statsTeams.map(statsTeam => {
    const detailTeam = detailMap.get(String(statsTeam.team_id || '').toLowerCase()) || {};
    return { ...detailTeam, ...statsTeam };
  });
}

async function getTeams(token){
  const data = await requestWorldCupJson(WORLD_CUP_TEAMS_API_URL, token);

  return normalizeWorldCupList(data, 'teams');
}

async function getGroups(token){
  const data = await requestWorldCupJson(WORLD_CUP_GROUPS_API_URL, token);
  const groups = normalizeWorldCupList(data, 'groups');
  const allTeams = await getTeams(token);
  const groupsWithTeams = [];

  for(const group of groups){
    const groupCode = getGroupCode(group);
    const statsTeams = typeof group === 'string' ? [] : (group.teams || []);
    const teams = statsTeams.length
      ? mergeTeamsWithStats(statsTeams, allTeams)
      : allTeams;

    groupsWithTeams.push(typeof group === 'string'
      ? { group: groupCode, teams }
      : { ...group, group: groupCode, teams });
  }

  return groupsWithTeams;
}

window.WORLD_CUP_API_BASE_URL = WORLD_CUP_API_BASE_URL;
window.WORLD_CUP_GROUPS_API_URL = WORLD_CUP_GROUPS_API_URL;
window.WORLD_CUP_TEAMS_API_URL = WORLD_CUP_TEAMS_API_URL;
window.getTeams = getTeams;
window.getGroups = getGroups;
