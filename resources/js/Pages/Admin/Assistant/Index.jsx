import React from "react";
import { Head } from "@inertiajs/react";
import TwentyCrmLayout from "../../../Layouts/TwentyCrmLayout";
import { AssistantWorkspace } from "../../../Components/Admin/PanelAssistant";
export default function Index() {
  return (
    <TwentyCrmLayout title="Asistente del panel">
      <Head title="Asistente operativo" />
      <div className="panel-communication-page">
        <h1>Asistente operativo</h1>
        <p>Consultas privadas para trabajar con el CRM y la bandeja.</p>
        <div className="panel-assistant-full">
          <AssistantWorkspace />
        </div>
      </div>
    </TwentyCrmLayout>
  );
}
