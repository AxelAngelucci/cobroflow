import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaginatedResponse,
  ClientApiResponse,
  InvoiceApiResponse,
  PaymentApiResponse,
  CreateClientRequest,
  UpdateClientRequest,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  CreatePaymentRequest,
  ImportClientsResponse,
  ClientsQueryParams,
  InvoicesQueryParams,
  PaymentsQueryParams
} from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ClientsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/clients`;

  // ============================================
  // CLIENTS ENDPOINTS
  // ============================================

  /**
   * Get paginated list of clients
   */
  getClients(params?: ClientsQueryParams): Observable<PaginatedResponse<ClientApiResponse>> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<PaginatedResponse<ClientApiResponse>>(`${this.apiUrl}/`, { params: httpParams });
  }

  /**
   * Get a single client by ID
   */
  getClient(clientId: string): Observable<ClientApiResponse> {
    return this.http.get<ClientApiResponse>(`${this.apiUrl}/${clientId}`);
  }

  /**
   * Create a new client
   */
  createClient(data: CreateClientRequest): Observable<ClientApiResponse> {
    return this.http.post<ClientApiResponse>(`${this.apiUrl}/`, data);
  }

  /**
   * Update an existing client
   */
  updateClient(clientId: string, data: UpdateClientRequest): Observable<ClientApiResponse> {
    return this.http.patch<ClientApiResponse>(`${this.apiUrl}/${clientId}`, data);
  }

  /**
   * Delete a client
   */
  deleteClient(clientId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${clientId}`);
  }

  // ============================================
  // IMPORT ENDPOINTS
  // ============================================

  /**
   * Download CSV template for bulk import
   */
  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/import/template`, {
      responseType: 'blob'
    });
  }

  /**
   * Import clients from a CSV file
   */
  importClients(file: File): Observable<ImportClientsResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportClientsResponse>(`${this.apiUrl}/import`, formData);
  }

  // ============================================
  // INVOICES ENDPOINTS
  // ============================================

  /**
   * Get paginated list of invoices for a client
   */
  getClientInvoices(
    clientId: string,
    params?: InvoicesQueryParams
  ): Observable<PaginatedResponse<InvoiceApiResponse>> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<PaginatedResponse<InvoiceApiResponse>>(
      `${this.apiUrl}/${clientId}/invoices`,
      { params: httpParams }
    );
  }

  /**
   * Create a new invoice for a client
   */
  createInvoice(clientId: string, data: CreateInvoiceRequest): Observable<InvoiceApiResponse> {
    return this.http.post<InvoiceApiResponse>(`${this.apiUrl}/${clientId}/invoices`, data);
  }

  /**
   * Update an invoice
   */
  updateInvoice(invoiceId: string, data: UpdateInvoiceRequest): Observable<InvoiceApiResponse> {
    return this.http.patch<InvoiceApiResponse>(`${this.apiUrl}/invoices/${invoiceId}`, data);
  }

  /**
   * Delete an invoice
   */
  deleteInvoice(invoiceId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/invoices/${invoiceId}`);
  }

  // ============================================
  // PAYMENTS ENDPOINTS
  // ============================================

  /**
   * Get paginated list of payments for a client
   */
  getClientPayments(
    clientId: string,
    params?: PaymentsQueryParams
  ): Observable<PaginatedResponse<PaymentApiResponse>> {
    let httpParams = new HttpParams();

    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size) {
      httpParams = httpParams.set('size', params.size.toString());
    }

    return this.http.get<PaginatedResponse<PaymentApiResponse>>(
      `${this.apiUrl}/${clientId}/payments`,
      { params: httpParams }
    );
  }

  /**
   * Create a new payment for a client
   */
  createPayment(clientId: string, data: CreatePaymentRequest): Observable<PaymentApiResponse> {
    return this.http.post<PaymentApiResponse>(`${this.apiUrl}/${clientId}/payments`, data);
  }
}
