---
name: GitHub 100MB file size limit
description: GitHub rejects files >100MB at push time; fix with git rm --cached
---

## Rule
GitHub hard-rejects files >100MB. The brand book PDF (107MB) was accidentally staged and caused push failure.

**Why:** GitHub has a hard pre-receive hook that rejects large files even if they were only temporarily staged.

**How to apply:** Before any `git push`, check for large files: `find . -size +90M -not -path './.git/*'`. If found, `git rm --cached <file>` and amend the commit before pushing.
