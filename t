[33mfc988a8[m[33m ([m[1;36mHEAD -> [m[1;32mrefactor/improve-UI/UX[m[33m)[m feature(LobbyPlaylistPicker): make playlist card fully clickable
[33m1b8a813[m fix(App): prevent spacebar from scrolling the page
[33mc8e9c92[m feature(MatchGuessSection): add keyboard navigation for guess search
[33m8dd2e63[m fix(MatchScoreboard): animate live ranking by score without podium colors
[33m6b86527[m fix(AppHeader): replace leave-room X with vivid red exit icon
[33m75a9a65[m fix(JoinRoomPage): auto-join room when 6-character code is entered
[33mf7135a1[m[33m ([m[1;31morigin/develop[m[33m, [m[1;32mdevelop[m[33m)[m refactor(HomePage): remove login button and set redirections on create and join (#110)
[33ma428537[m feature(NavBar): extract language button w/o login (#109)
[33mb870b35[m refactor(HomePage): remove landing page and clean HomePage (#108)
[33m1836e3a[m chore(gitignore): add media directory
[33m93ec91b[m fix(playlist-selector): allow playlist selection w/o login (#107)
[33m8bf360c[m Refactor(default-playlist): bootstrap Default Mix from Spotify (#106)
[33md106c2e[m Fix(match): return home after leaving a room (#104)
[33m794c838[m Fix(ui): link Songuess wordmark to landing page (#103)
[33md487438[m fix: add leave button fix (#99)
[33ma0f7d52[m Refactor/clip worker (#105)
[33m231c04e[m Feature(ui): add compact public landing page (#100)
[33m4285f67[m chore(guidelines): add Spotify API guidelines
[33mbbf6784[m chore(gitignore): add clips to gitignore
[33mfdedcae[m fix(downloader): add flags to script and upload the previews
[33m2b8e99a[m chore: delete rules
[33m51be80b[m[33m ([m[1;32msetup/add-previews[m[33m, [m[1;32mfeature/fresh-setup[m[33m)[m feature(MatchPage): show typing guess to all players in real time (#98)
[33m49d4bfd[m refactor: center the footer (#93)
[33m172e78e[m Add give up button (#95)
[33mb886296[m feature(MatchPage): add skip button (#97)
[33m38876b4[m Feature/playlist selection (#96)
[33m3b58de6[m fix(gateway): fix jwt_secret and clean .env
[33m6e684ff[m Merge pull request #94 from pacomariano28/docs/document-local-media-setup
[33m9815070[m Merge pull request #92 from pacomariano28/fix/match-socket-listener-rebind
[33mfcc766f[m Merge pull request #91 from pacomariano28/fix/round-sync-force-countdown-timing
[33m660a22e[m Merge pull request #90 from pacomariano28/fix/gateway-jwt-secret-fallback
[33m9c4e8bf[m Merge pull request #89 from pacomariano28/fix/oauth-callback-error-leak
[33m191b742[m Merge pull request #88 from pacomariano28/feature/add-rjaada-credits
[33mf95f88f[m Merge pull request #87 from pacomariano28/fix/jwt-access-token-lifetime
[33m2335de4[m Docs: document local media setup and fix stale certs path
[33m46a1c5b[m Fix(match): stabilize socket listener effect against re-renders
[33m83f05a1[m Fix(game): correct FORCE_COUNTDOWN_MS from 150ms to 5s
[33mfa6c344[m Fix(auth): fail fast on missing JWT_SECRET in api-gateway
[33m5111587[m Fix(auth): stop leaking raw error details from OAuth callback
[33m3e13467[m Feature(ui): add rjaada to homepage credits
[33m0ef3a9f[m Fix(auth): restore 15-minute access token lifetime
[33mcc4c1bb[m Refactor/translate comments to english (#86)
[33m7903161[m refactor(profile): swap display order of email and username (#85)
[33mb2c3f48[m fix(playlist): ensure song has metadata (#84)
[33meb56a9d[m Refactor/enhance UI (#83)
[33md22d400[m feature(rematch): add opt-in play again with unified page transitions (#82)
[33m09dbe12[m feature(matchPage): redirect to spotify on album hover (#81)
[33ma56869a[m Fix/song validation (#80)
[33md198f4d[m feature(match): reveal song on round timeout and polish result UI (#79)
[33m4083a28[m refactor(searchBar): enhance UI (#78)
[33mdb55c05[m Refactor/improve code input (#77)
[33m9378c99[m Feature/localization improved (#76)
[33m5d01ae6[m fix(downloader): add a not static root path of the project (#75)
[33me020071[m Refactor/styles (#74)
[33m428f036[m refactor(game-service): modularize match.service into focused submodules (#73)
[33m27d6d40[m Refactor/modularize match page (#72)
[33mda4cb5e[m feature(MatchPage): enhance UI UX (#71)
[33m8d6825f[m fix(content-service): remove song version cleanup (#70)
[33m94965d7[m fix(HomePage): block game creation on < 5 available songs (#69)
[33m55afb4b[m Fix/fake wrong answer (#68)
[33m6c51886[m feature/privacy-terms-pages: add Privacy Policy and Terms of Service pages (#67)
[33m257b87c[m feature/downloader-script: add and upgrade downloader.sh (#66)
[33m80aca06[m Feature/not found (#65)
[33mc89ebd3[m feature/not found (#64)
[33me849819[m fix: delete files connected with DashboardPage.tsx (#63)
[33m12661db[m fix(oauth): return to loginPage if Spotify login is cancelled (#62)
[33m0476c89[m fix(page-reload): fix song resume when page reloads (#61)
[33m75c430b[m fix: properly clean up lobby state when leaving a room (#60)
[33m06793fb[m fix: clean up match state after game ends (#59)
[33m4046495[m fix(auth): validate Spotify OAuth state server-side (#58)
[33md0bb931[m fix(game): broadcast guess selection in round:guess_result (#57)
[33m3a887af[m Fix round guess result with selected track metadata (#56)
[33m5dab5f9[m Fix/cooldown restriction (#55)
[33mb2b9488[m Fix/unauthorize home page (#53)
[33m840d0bd[m Feature/running background match (#52)
[33m043c281[m Refactor/database split (#51)
[33me50d02c[m[33m ([m[1;31morigin/fix/bypass-autoplay-block[m[33m)[m refactor(MatchPage - JoinRoomPage): enhance UI (#50)
[33m9c39957[m Feature/resume match (#49)
[33m3ef49d9[m refactor(MatchPage): enhance UI and clean code (#48)
[33m0792cb3[m Fix/lock create match (#47)
[33me64e1e3[m Merge pull request #46 from pacomariano28/refactor/migration-persistence
[33m51690f3[m refactor: keep microservices persistence
[33m39391d1[m ci(migration): added migrations
[33m38c6887[m Feature/audio visualizer (#45)
[33mf4b1267[m Refactor/socket handling (#44)
[33m25b4c9a[m refactor(scripts): restructure certificate and environment generation scripts and add to Makefile (#43)
[33m87b612a[m refactor(home-page): add error handling display for room creation (#42)
[33mf31a1ce[m refactor(lobby-page): enhance UI (#41)
[33m31d14cc[m refactor(create-room): remove round selection (#40)
[33mfe6ebe8[m refactor(component)  LinkIcon component for consistent SVG attribute casing (#39)
[33m61c85c1[m Refactor/home page (#38)
[33mc2d2a76[m Refactor/match total rounds (#36)
[33m8ec4e1a[m Refactor game service and constants for improved structure (#35)
[33m3c3efe1[m Refactor/game service (#34)
[33mb5227a3[m Revert "feature(game-service): implement  playlist retrieval (#32)"
[33m5999d53[m Revert "Implement playlist retrieval and enhance lobby management (#33)"
[33m3a48a41[m Implement playlist retrieval and enhance lobby management (#33)
[33m9347cd9[m feature(game-service): implement  playlist retrieval (#32)
[33m9f763cf[m fix(nginx/env): fix environment and nginx scripts (#31)
[33ma2bde41[m Feature/match (#30)
[33m5d766bf[m Revert "Feature/lobby persistence (#29)"
[33mae1459f[m Feature/lobby persistence (#29)
[33mc805b22[m Feature/script to setup env files (#28)
[33m2d7e69a[m chore(package-lock): fix dependencies vulnerabilities
[33m80abfd6[m Implement game track synchronization and add CORS support (#27)
[33mcab3afa[m Enhance game service and frontend with socket.io integration (#26)
[33m3a3c86a[m docs(docs): add chosen modules
[33m8ffe8ef[m[33m ([m[1;31morigin/fix/lobbyPage-frontend[m[33m)[m Implement game service and enhance frontend with socket integration (#25)
[33m017fddb[m docs: update README with project overview, setup instructions, and service details
[33m0480010[m Implement playlist service (#24)
[33mf3df4f5[m chore: update configuration files and improve error handling in LoginPage
[33m4fc869e[m feature(frontend): add main application structure and pages
[33mcef4a17[m chore: install prettier and eslint (#22)
[33m2fd4b49[m chore(auth-service): automate DB schema setup via Prisma migrations
[33mfbca5f5[m chore(auth-service): update .prettierignore and remove .prettierrc.json; fix markdown formatting in NOTES.md
[33me5e8606[m Implement authentication service with JWT, OAuth, and database support (#20)
[33mc8d3262[m fix(dockerfile): update node version to 24.15.0-alpine3.22 across all services
[33m4a3f276[m ops(dockerfile): remove user node directive from development
[33m88b2940[m Implement auth-service with database persistence and JWT rotation (#19)
[33meefa4e7[m ops: refactor infrastructure
[33mc61d704[m chore(package-lock): remove libc entries and update postcss version to 8.5.12
[33mf671f2e[m refactor(compose): comment out nginx-reload service and update redis port
[33me2d0366[m Add authentication proxy and registration components with JWT support (#18)
[33mf80f5c9[m Setup auth-service with JWT authentication and health endpoint (#17)
[33me394eb6[m feat(api-gateway): implement health check and search functionality with logging enhancements
[33m21bf308[m chore(api-gateway): add health check variables to .env.example
[33m41055fe[m Refactor Dockerfiles, TypeScript config, and service management
[33mdb08c65[m Refactor Dockerfiles, TypeScript config, and service management (#16)
[33m6b192d2[m feat: enhance logging and error handling in content-service
[33m91cede1[m chore(Makefile): add start command
[33m18a9d1c[m chore(Makefile): add stop command
[33mfb030bd[m feat(api-gateway): implement health check endpoint and search functionality with rate limiting
[33m803cf91[m chore(api-gateway): add readme
[33m90bb2d1[m refactor(content-service): add string normalization and clearing utilities
[33m8463598[m refactor(spotify-service): add utility functions for string normalization
[33m7b2db52[m fix(content-service): add target production in compose
[33me2b597b[m Implement Spotify search functionality with API gateway and caching (#14)
[33mb5172fb[m chore: add example environment configuration files for auth, game, and frontend services
[33m92afad0[m feat(content-service): integrate Redis for token caching and add Redis configuration
[33m01dba61[m refactor(spotify-service): adapt token retrieval to use promise and handle fetching state
[33me948dbb[m feat(content-service): add content service with search functionality
[33me1e4d5f[m refactor(api-gateway): implement api-gateway as reverse-proxy
[33m46efa9a[m fix: use token parameter instead global cachedToken
[33m739aeb6[m feat: implement search controller with track query handling
[33m8add419[m feat: define search route
[33m1e7b66a[m feat: implement spotify track search and token management
[33md20b686[m feat: initialize express app with cors and search routes
[33m1ca4fe7[m build: add axios cors dependencies
[33m21b10a4[m chore: comment out environment lines
[33m98261c5[m chore: setup .env for Spotify credentials
[33me25e7c2[m Merge branch 'main' into develop
[33maf3acef[m Setup auth-service skeleton and connect health endpoint (#13)
[33m6993bcc[m fix: generate certificate in the correct path despite path of execution
[33mfbcdfc6[m fix: generate certificate in the correct path despite path of execution
[33m736acfb[m chore(.gitignore): delete git messages
[33m9c98209[m Merge branch 'feature/nginx-tls' into develop
[33meed2d33[m refactor(cert.sh): add 'mkdir certs' to script
[33mf16283c[m setup(nginx): create certificate authority to validate openssl certificates
[33m8ddab11[m refactor: include CA and backup files to .gitignore
[33md989165[m refactor: include CA and backup to .gitignore
[33me792ccd[m Add crt and key files to .gitignore and remove from certs  (#12)
[33mf51bcb0[m Add crt and key files to .gitignore and remove from certs (#11)
[33m09bb37c[m remove: crt and key files from infra/certs
[33mc8ac069[m feat: add crt and key files to .gitignore
[33m5d3d701[m Revert "Add commit message format guidelines"
[33m920fde6[m Revert "Add commit message format guidelines"
[33m6dce129[m Add commit message format guidelines
[33m39a0665[m Merge pull request #10 from pacomariano28/develop
[33mccaf623[m Merge branch 'feature/nginx-tls' into develop
[33m1860e58[m remove: http2 nginx directive
[33mda47502[m setup(infra): add crt and key files needed for tls
[33mc14dac0[m remove: crt and key files included on .gitignore
[33m2b84f54[m feat: add tls configuration
[33m9845588[m Refactor: removed types and added Remove:
[33ma76073e[m remove: expose port 80
[33mb198eb6[m Add commit message format guidelines
[33m06ee9d5[m feat: http redirection to https
[33mdf9603b[m feat: add crt and key files to .gitignore
[33mc8342c0[m feat: add env.example
[33m198640e[m setup: initial structure template
[33m1620162[m Initial commit
