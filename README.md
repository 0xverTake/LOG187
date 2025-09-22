# Log 187 - Operations Hub

Ce projet est une application web "full-stack" construite avec Cloudflare Pages et Functions, utilisant une base de données D1 pour stocker des "missions".

### Guide de Déploiement : de Zéro à En Ligne

Suis ces étapes dans l'ordre.

#### Étape 1 : Créer le Dépôt sur GitHub

1.  Va sur [GitHub](https://github.com) et connecte-toi.
2.  Clique sur "New" pour créer un nouveau dépôt.
3.  Donne-lui un nom (ex: `log187-hub`), choisis "Public" et clique sur "Create repository".

#### Étape 2 : Uploader tes Fichiers sur GitHub

1.  Ouvre un terminal ou une invite de commande dans ton dossier de projet `/log187-hub`.
2.  Initialise Git et envoie tes fichiers avec les commandes suivantes (copie-colle l'URL de ton dépôt que GitHub te donne) :

```bash
git init
git add .
git commit -m "Première version du Hub d'Opérations"
git branch -M main
git remote add origin https://github.com/TON_NOM_UTILISATEUR/log187-hub.git
git push -u origin main
```
Tes fichiers sont maintenant sur GitHub !

#### Étape 3 : Connecter GitHub à Cloudflare Pages

1.  Retourne sur ton tableau de bord Cloudflare.
2.  Va dans **Workers & Pages** > **Create application** > onglet **Pages**.
3.  Clique sur **Connect to Git**.
4.  Autorise Cloudflare à accéder à ton compte GitHub et sélectionne le dépôt `log187-hub`.
5.  Clique sur **Begin setup**.

#### Étape 4 : Configurer le Déploiement

C'est l'étape la plus importante.
1.  **Project name** : `log187-hub` (ou ce que tu veux).
2.  **Production branch** : `main`.
3.  Dans la section **Build settings**, configure comme suit :
    * **Framework preset** : Laisse sur `None`.
    * **Build command** : Laisse ce champ **VIDE**.
    * **Build output directory** : Écris `public`.
4.  Clique sur **Save and Deploy**.

Cloudflare va maintenant récupérer ton code sur GitHub et le déployer. Le premier déploiement peut prendre une minute.

#### Étape 5 : Lier la Base de Données (Crucial !)

Ton site est en ligne, mais il ne peut pas encore parler à la base de données.
1.  Une fois le déploiement terminé, clique sur ton nouveau projet `log187-hub` dans la liste.
2.  Va dans l'onglet **Settings** > **Functions**.
3.  Descends jusqu'à la section **D1 Database Bindings** et clique sur **Add binding**.
4.  Remplis les champs :
    * **Variable name** : `DB` (doit correspondre exactement au `binding` de ton `wrangler.toml`).
    * **D1 Database** : Sélectionne ta base `log187-missions` dans la liste.
5.  Clique sur **Save**.

Un nouveau déploiement va se déclencher automatiquement. Une fois terminé, ton application sera **100% fonctionnelle**, en ligne, et connectée à sa base de données.

**Félicitations !** Tu as maintenant un workflow de déploiement professionnel. Chaque fois que tu voudras faire une modification, il te suffira de la `push` sur GitHub, et Cloudflare s'occupera du reste.
