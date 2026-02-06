interface GithubStats {
  stars: number;
  languages: string[];
  topics: string[];
}

export async function fetchGithubProjectStats(repoUrl: string): Promise<GithubStats | null> {
  const regex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = repoUrl.match(regex);

  if (!match) {
    console.error(`URL inválida ou não é do GitHub: ${repoUrl}`);
    return null;
  }

  const owner = match[1];
  const repo = match[2].replace('.git', '');

  try {
    const headers: HeadersInit = {
      'User-Agent': 'WillianDDaniel-Portfolio-Backend',
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${process.env.GITHUB_KEY}`
    };
    
    const [infoRes, langRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers })
    ]);

    if (!infoRes.ok || !langRes.ok) {
      console.error(`Erro ao buscar dados do GitHub para ${owner}/${repo}`);
      return null;
    }

    const infoData = await infoRes.json();
    const langData = await langRes.json();

    return {
      stars: infoData.stargazers_count,
      topics: infoData.topics || [],
      languages: Object.keys(langData),
    };

  } catch (error) {
    console.error('Erro na função fetchGithubProjectStats:', error);
    return null;
  }
}