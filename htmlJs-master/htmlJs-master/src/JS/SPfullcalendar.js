
var PATH_TO_DISPFORM = _spPageContextInfo.webAbsoluteUrl  + "/Lists/Agendamentos/DispForm.aspx";
var TASK_LIST = "Agendamentos";
var Fabrica_LIST = "Fábricas Internas e Armazenamento de Fábricas Terceiras";
//var coresFabricas = new Array();
var coresTipoLote = new Array();
var cores = ["#E40000", "#446AC1", "#B2B208", "#FFA565", "#88D73C", "#2A9983", "#EDA700", "#8B2F9E", "#999090", "#E490AE"];
var events;

var tiposLote = ["Brinde","Envase","Fabricação","Picking"];

for (index in tiposLote) {
    var corNum = index.substr(index.length - 1);
    var corNome = cores[corNum];

    var cor = {};
    cor.tipoLote = tiposLote[index];
    cor.cor = corNome;
    
    coresTipoLote.push(cor);

    $("#legenda").append(`<div style="padding-left: 10px;"><span class="legenda" style=" width:20px; height: 20px; background-color: `+ cor.cor+`"></span><span class="legenda">`+ cor.tipoLote+`</span></div>`);
      
}



var FabricaRESTQuery = "/_api/Web/Lists/GetByTitle('" + Fabrica_LIST + "')/items?$select=ID,Chave";
var FabricaSelecionada = "*";


var openFabricaCall;


function ConvertToString(valor){

    return valorTratado = !valor ?  "" : String(valor);
}

$('#fabrica-selector').on('change', function () {
    FabricaSelecionada = this.value;
    DisplayTasks();
});

DisplayTasks();

function DisplayTasks() {

    openFabricaCall = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + FabricaRESTQuery +"&$top=3000",
        type: "GET",
        async: false,
        dataType: "json",
        headers: {
            Accept: "application/json;odata=verbose"
        }
    });

    var initialLocaleCode = 'pt-br';
    $('#calendar').fullCalendar('destroy');
    var RESTQuery = "";

            if (FabricaSelecionada != "*") {
                RESTQuery = "/_api/Web/Lists/GetByTitle('" + TASK_LIST + "')/items?$select=ID,Title,Status,HaveraAcompanhamento,InicioProgramado,FimProgramado,CodigoProduto,DescricaoProduto,TipoLote,Fabrica/ID,Fabrica/Chave&$expand=Fabrica&$filter=(Status eq 'Agendado' or Status eq 'Lote Não Executado') and Fabrica/ID eq " + FabricaSelecionada;
            }
            else {
                RESTQuery = "/_api/Web/Lists/GetByTitle('" + TASK_LIST + "')/items?$select=ID,Title,Status,HaveraAcompanhamento,InicioProgramado,FimProgramado,CodigoProduto,DescricaoProduto,TipoLote,Fabrica/ID,Fabrica/Chave&$expand=Fabrica&$filter=(Status eq 'Agendado' or Status eq 'Lote Não Executado')";
            }
            events = [];
            
            LoadEvents(_spPageContextInfo.webAbsoluteUrl + RESTQuery + "&$top=2000");
            
    $('#calendar').fullCalendar({
        buttonText: {
            listMonth: 'Lista'
        },
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay,listMonth'
        },
        locale: 'pt-br',
        //open up the display form when a user clicks on an event
        eventClick: function (calEvent, jsEvent, view) {
            window.open(PATH_TO_DISPFORM + "?ID=" + calEvent.id, "_blank");
        },
        eventRender: function (eventObj, $el) {
            $el.popover({
                title: eventObj.title,
                content: eventObj.description,
                html: true,
                trigger: 'hover',
                placement: 'top',
                container: 'body'
            });
        },

        editable: false,
        themeSystem: 'bootstrap4',
        eventLimit: true,
        navLinks: true,
        droppable: false, // this allows things to be dropped onto the calendar
        //update the end date when a user drags and drops an event
        eventDrop: function (event, delta, revertFunc) {
            UpdateTask(event.id, event.end);
        },
        //put the events on the calendar
        events: function (start, end, timezone, callback) {
           callback(events)
            
        }
    });
}


function LoadEvents(url){
    var opencall = $.ajax({
        url: url,
        type: "GET",
        async:false,
        dataType: "json",
        headers: {
            Accept: "application/json;odata=verbose"
        }
    });

    opencall.done(function (data, textStatus, jqXHR) {
        
       
        for (index in data.d.results) {
            var fabrica = "";
            var titulo = ConvertToString(data.d.results[index].CodigoProduto);
            var descricaoProduto = ConvertToString(data.d.results[index].DescricaoProduto);
            var tipoLote = ConvertToString(data.d.results[index].TipoLote);
            var cor = "#E40000";
            var inicio = moment.utc(data.d.results[index].InicioProgramado).local();
            var fim = moment.utc(data.d.results[index].FimProgramado).local();
            var haveraAcompanhamento = (data.d.results[index].HaveraAcompanhamento === "1")
            var strHaveraAcompanhamento = haveraAcompanhamento ? 'Sim' : 'Não';
            
            
            try{
                if(ConvertToString(data.d.results[index].TipoLote)){
                    cor = (coresTipoLote.filter(obj => { return obj.tipoLote === data.d.results[index].TipoLote }))[0].cor
                }

                if (data.d.results[index].Fabrica.Chave) {
                    fabrica = ConvertToString(data.d.results[index].Fabrica.Chave);
                   //desativandoCorPorFabrica cor = (coresFabricas.filter(obj => { return obj.id === data.d.results[index].Fabrica.ID }))[0].cor
                }
            }

            catch(err){
                console.log(err);
                console.log(data.d.results[index].Fabrica.ID);
                console.log((coresFabricas.filter(obj => { return obj.id === data.d.results[index].Fabrica.ID })));
                console.log(data.d.results);
                console.log(coresFabricas);
            }
            if(haveraAcompanhamento){
                titulo = '\u2690' + " " +titulo;
            }
            events.push({
                // title: data.d.results[index].Title ,
                title: titulo,
                id: data.d.results[index].ID,
                border : haveraAcompanhamento ? "dashed" : "solid",
                color: cor, //specify the background color and border color can also create a class and use className paramter.
                start: inicio.format('YYYY-MM-DD HH:mm'),
                end: fim.format('YYYY-MM-DD HH:mm'), //add one day to end date so that calendar properly shows event ending on that day
                description: descricaoProduto + "<br /><b>Tipo de Lote: </b>" + tipoLote + "<br /><b>Fábrica: </b>" + fabrica + "<br /><b> Haverá acompanhamento: </b>" + strHaveraAcompanhamento + "<br /><b>Início: </b>" + inicio.format('DD-MM-YYYY HH:mm') + "<br /><b>Fim: </b>" + fim.format('DD-MM-YYYY HH:mm')
            });
        }
        if (data.d.__next) {
            url = data.d.__next;
            LoadEvents(url);
        }
    });

}
function UpdateTask(id, dueDate) {
    //substract the previoulsy added day to the date to store correct date
    sDate = moment.utc(dueDate).add("-1", "days").format('YYYY-MM-DD') + "T" +
        dueDate.format("hh:mm") + ":00Z";

    var call = jQuery.ajax({
        url: _spPageContextInfo.webAbsoluteUrl +
            "/_api/Web/Lists/getByTitle('" + TASK_LIST + "')/Items(" + id + ")",
        type: "POST",
        data: JSON.stringify({
            DueDate: sDate,
        }),
        headers: {
            Accept: "application/json;odata=nometadata",
            "Content-Type": "application/json;odata=nometadata",
            "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
            "IF-MATCH": "*",
            "X-Http-Method": "PATCH"
        }
    });
    call.done(function (data, textStatus, jqXHR) {
        alert("Update Successful");
        DisplayTasks();
    });
    call.fail(function (jqXHR, textStatus, errorThrown) {
        alert("Update Failed");
        DisplayTasks();
    });
}

openFabricaCall.done(function (data, textStatus, jqXHR) {

    for (index in data.d.results) {
        var corNum = index.substr(index.length - 1);
        var corNome = cores[corNum];

        var cor = {};
        cor.id = data.d.results[index].ID;
        cor.cor = corNome;

        // removido cores por fabrica coresFabricas.push(cor);

        $('#fabrica-selector').append(
            $('<option/>')
                .attr('value', data.d.results[index].ID)
                .text(data.d.results[index].Chave)
        );
    }
});