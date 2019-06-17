function VerificarPermissoes() {
    $().SPServices({

        operation: "GetGroupCollectionFromUser",
        userLoginName: $().SPServices.SPGetCurrentUser(),
        async: false,
        completefunc: function (xData, Status) {
            if (($(xData.responseXML).find("Group[Name = 'Agendamento - DLL']").length == 1)||
            ($(xData.responseXML).find("Group[Name = 'Agendamento - Planta Piloto']").length == 1)||
            ($(xData.responseXML).find("Group[Name = 'Administradores Lote Piloto']").length == 1)) {
                $(".row").append("<a class='btn btn-primary' id='btnNovo' href='/sites/DEV_LotePiloto/SiteAssets/main.aspx?action=new' target='_self'>Novo</a>");
            }
            else {
                $(".row").remove("#btnNovo");
            }
        }
    });
}

function CarregarTodosAgendamentos() {
    var $promise = $.Deferred();

    $().SPServices({
        operation: 'GetListItems',
        listName: 'Agendamentos',
        CAMLViewFields: '<ViewFields><FieldRef Name="ID" /><FieldRef Name="CodigoProduto" /><FieldRef Name="Title" /><FieldRef Name="TipoLote" /><FieldRef Name="Motivo" /><FieldRef Name="Status" /><FieldRef Name="RegistroAnalisesInicio" /><FieldRef Name="Modified" /><FieldRef Name="Editor" /><FieldRef Name="InicioProgramado" /><FieldRef Name="_UIVersionString" /></ViewFields>',
        completefunc: function (Data, Status) {
            if (Status != 'success') {
                $promise.reject({
                    errorCode: '0x99999999',
                    errorText: 'Erro Remoto'
                });

                return;
            }

            $(Data.responseXML).SPFilterNode("z:row").each(function () {
                var valID = (typeof $(this).attr("ows_ID") === "undefined") ? '' : $(this).attr("ows_ID");
                var valCodigoProduto = (typeof $(this).attr("ows_CodigoProduto") === "undefined") ? '' : $(this).attr("ows_CodigoProduto");
                var valTitle = (typeof $(this).attr("ows_Title") === "undefined") ? '' : $(this).attr("ows_Title");
                var valTipoLote = (typeof $(this).attr("ows_TipoLote") === "undefined") ? '' : $(this).attr("ows_TipoLote");
                var valMotivo = (typeof $(this).attr("ows_Motivo") === "undefined") ? '' : $(this).attr("ows_Motivo");
                var valStatus = (typeof $(this).attr("ows_Status") === "undefined") ? '' : $(this).attr("ows_Status");
                var valRegistroAnalisesInicio = (typeof $(this).attr("ows_RegistroAnalisesInicio") === "undefined") ? '' : $(this).attr("ows_RegistroAnalisesInicio");
                var valModified = (typeof $(this).attr("ows_Modified") === "undefined") ? '' : $(this).attr("ows_Modified");
                var valEditor = (typeof $(this).attr("ows_Editor") === "undefined") ? '' : $(this).attr("ows_Editor").split(";#")[1];
                var valInicioProgramado = (typeof $(this).attr("ows_InicioProgramado") === "undefined") ? '' : $(this).attr("ows_InicioProgramado");
                var valUIVersionString = (typeof $(this).attr("ows__UIVersionString") === "undefined") ? '' : $(this).attr("ows__UIVersionString");

                $('tbody#AgendamentoBody').append('<tr><td><a href="/sites/DEV_LotePiloto/SiteAssets/main.aspx?action=edit&loteid=' + valID + '" target="_self">' + valID + '</a></td><td>' + valCodigoProduto + '</td><td>' + valTitle + '</td><td>' + valTipoLote + '</td><td>' + valMotivo + '</td><td>' + valStatus + '</td><td>' + valRegistroAnalisesInicio + '</td><td>' + valModified + '</td><td>' + valEditor + '</td><td>' + valInicioProgramado + '</td><td><a href="/sites/DEV_LotePiloto/_layouts/15/Versions.aspx?list={8FEC2F9D-C97E-42EF-9B2C-0845CF7B2A52}&ID=' + valID + '&IsDlg=1" target="_blank">' + valUIVersionString + '</a></td></tr>');
            });

            $promise.resolve();
        }
    });

    return $promise;
}


$(document).ready(function () {
    VerificarPermissoes();
    CarregarTodosAgendamentos();
});
