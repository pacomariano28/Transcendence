**Crear un usuario**
curl -k -X POST https://localhost:8443/api/auth/register -H "Content-type: application/json" -d '{"email":"pacomariano28@gmail.com", "username":"pacowner", "password":"123"}'

**Comprobar que existen**
OLD
`docker exec -it songuess-postgres psql -U postgres_user -d postgres_db -c '\dt '`
NEW
docker exec -it songuess-postgres psql -U auth_db -c '\d+ '
docker exec -it songuess-postgres psql -U auth_db -c '\dt '

**Ver tabla User**
OLD
`docker exec -it songuess-postgres psql -U postgres_user -d postgres_db -c 'SELECT * FROM "User";'`
NEW
docker exec -it songuess-postgres psql -U auth_db -c 'SELECT \* FROM "User";'

fetch("https://127.0.0.1:8443/api/auth/me", {
method: "GET",
credentials: "include",
})
.then(async (r) => ({ status: r.status, body: await r.json() }))
.then(console.log)
.catch(console.error);

Si alguien le da que no al aceptar el oauth el callback pa donde va?
