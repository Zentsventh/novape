export async function panelApi(url, data) {
  return (
    await window.axios({
      url,
      method: data === undefined ? "get" : "post",
      data,
      headers: { Accept: "application/json" },
    })
  ).data;
}
export function panelError(error) {
  return (
    Object.values(error.response?.data?.errors || {}).flat()[0] ||
    error.response?.data?.message ||
    "No se pudo completar la operación. Intenta nuevamente."
  );
}
